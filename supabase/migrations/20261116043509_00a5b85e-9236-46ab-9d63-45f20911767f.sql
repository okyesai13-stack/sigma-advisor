DO $$
DECLARE u uuid; outsider uuid; w uuid; w2 uuid; p uuid; t uuid; count_ integer;
BEGIN
 SELECT id INTO u FROM public.profiles ORDER BY created_at LIMIT 1;
 SELECT id INTO outsider FROM public.profiles WHERE id<>u ORDER BY created_at LIMIT 1;
 IF u IS NULL OR outsider IS NULL THEN RAISE EXCEPTION 'Need two existing profiles for security checks'; END IF;
 BEGIN
 PERFORM set_config('request.jwt.claim.sub',u::text,true);
 w:=public.create_workspace('Phase 2 verification','team');
 INSERT INTO public.workspaces(name,owner_id) VALUES('Other workspace verification',outsider) RETURNING id INTO w2;
 INSERT INTO public.workspace_members(workspace_id,user_id,role) VALUES(w2,outsider,'owner');
 SET LOCAL ROLE authenticated;
 INSERT INTO public.projects(workspace_id,name,owner_id) VALUES(w,'Security verification',u) RETURNING id INTO p;
 INSERT INTO public.tasks(workspace_id,project_id,title,assignee_id) VALUES(w,p,'Verification task',u) RETURNING id INTO t;
 UPDATE public.tasks SET status='done',version=0 WHERE id=t;
 SELECT count(*) INTO count_ FROM public.task_activity_logs WHERE task_id=t;
 IF count_<>2 THEN RAISE EXCEPTION 'Activity history not recorded'; END IF;
 BEGIN UPDATE public.tasks SET priority='High',version=0 WHERE id=t; RAISE EXCEPTION 'Stale task update accepted'; EXCEPTION WHEN raise_exception THEN IF SQLERRM='Stale task update accepted' THEN RAISE; END IF; END;
 BEGIN INSERT INTO public.tasks(workspace_id,project_id,title) VALUES(w2,p,'Invalid relationship'); RAISE EXCEPTION 'Cross workspace task accepted'; EXCEPTION WHEN foreign_key_violation OR insufficient_privilege THEN NULL; END;
 BEGIN UPDATE public.tasks SET assignee_id=outsider,version=1 WHERE id=t; RAISE EXCEPTION 'Invalid assignee accepted'; EXCEPTION WHEN foreign_key_violation THEN NULL; END;
 PERFORM set_config('request.jwt.claim.sub',outsider::text,true);
 SELECT count(*) INTO count_ FROM public.projects WHERE id=p;
 IF count_<>0 THEN RAISE EXCEPTION 'Other workspace project leaked'; END IF;
 SELECT count(*) INTO count_ FROM public.tasks WHERE id=t;
 IF count_<>0 THEN RAISE EXCEPTION 'Other workspace task leaked'; END IF;
 RESET ROLE;
 UPDATE public.workspace_members SET role='viewer' WHERE workspace_id=w AND user_id=u;
 PERFORM set_config('request.jwt.claim.sub',u::text,true);
 SET LOCAL ROLE authenticated;
 BEGIN INSERT INTO public.tasks(workspace_id,project_id,title) VALUES(w,p,'Viewer write'); RAISE EXCEPTION 'Viewer write accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 RESET ROLE;
 RAISE SQLSTATE 'P0002' USING MESSAGE='verification_passed';
 EXCEPTION WHEN no_data_found THEN IF SQLERRM<>'verification_passed' THEN RAISE; END IF; RAISE NOTICE 'Phase 2: workspace creation, project/task writes, activity, stale update rejection, cross-workspace rejection, assignee validation and viewer protections passed; fixtures rolled back';
 END;
END $$;