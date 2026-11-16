CREATE TABLE public.ai_action_proposals(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,user_id uuid NOT NULL,workspace_id uuid,project_id uuid,business_id uuid,kind text NOT NULL,plan jsonb NOT NULL,cost integer NOT NULL DEFAULT 0,status text NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Executing','Completed','Failed','Cancelled')),result jsonb,error_message text,expires_at timestamptz NOT NULL DEFAULT now()+interval '1 day',created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.ai_action_proposals TO authenticated;GRANT ALL ON public.ai_action_proposals TO service_role;
ALTER TABLE public.ai_action_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY proposal_read ON public.ai_action_proposals FOR SELECT TO authenticated USING(user_id=auth.uid() AND EXISTS(SELECT 1 FROM public.ai_conversations c WHERE c.id=conversation_id));
CREATE TABLE public.ai_action_execution_logs(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),proposal_id uuid NOT NULL REFERENCES public.ai_action_proposals(id) ON DELETE CASCADE,event text NOT NULL,details jsonb NOT NULL DEFAULT '{}',created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.ai_action_execution_logs TO authenticated;GRANT ALL ON public.ai_action_execution_logs TO service_role;
ALTER TABLE public.ai_action_execution_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY action_log_read ON public.ai_action_execution_logs FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.ai_action_proposals p WHERE p.id=proposal_id));
CREATE INDEX proposal_conversation ON public.ai_action_proposals(conversation_id,created_at DESC);
CREATE TRIGGER proposal_touch BEFORE UPDATE ON public.ai_action_proposals FOR EACH ROW EXECUTE FUNCTION public.touch_ai_record();
CREATE TRIGGER execution_log_touch BEFORE UPDATE ON public.ai_action_execution_logs FOR EACH ROW EXECUTE FUNCTION public.touch_ai_record();
ALTER TABLE public.ai_requests ADD COLUMN heartbeat_at timestamptz NOT NULL DEFAULT now();
ALTER POLICY ai_conversations_create ON public.ai_conversations WITH CHECK(user_id=auth.uid() AND (workspace_id IS NULL OR public.workspace_role(workspace_id) IS NOT NULL) AND (project_id IS NULL OR EXISTS(SELECT 1 FROM public.projects p WHERE p.id=ai_conversations.project_id AND p.workspace_id=ai_conversations.workspace_id)) AND (business_id IS NULL OR EXISTS(SELECT 1 FROM public.business_store b WHERE b.id=ai_conversations.business_id AND b.user_id=auth.uid())));
CREATE SCHEMA IF NOT EXISTS ai_private;
REVOKE ALL ON SCHEMA ai_private FROM PUBLIC,anon;GRANT USAGE ON SCHEMA ai_private TO authenticated,service_role;
CREATE FUNCTION ai_private.decide_proposal(p_id uuid,p_approve boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.ai_action_proposals;c public.ai_conversations;a jsonb;v jsonb;pid uuid;tid uuid;mid uuid;rid uuid;ids jsonb:='{}';receipt jsonb:='[]';ver integer;expected text;start_ date;due_ date;
BEGIN
 SELECT * INTO p FROM public.ai_action_proposals WHERE id=p_id FOR UPDATE;
 IF auth.uid() IS NULL OR p.id IS NULL OR p.user_id<>auth.uid() THEN RAISE EXCEPTION 'Proposal access denied' USING ERRCODE='42501';END IF;
 SELECT * INTO c FROM public.ai_conversations WHERE id=p.conversation_id;
 IF c.user_id<>auth.uid() OR c.workspace_id IS DISTINCT FROM p.workspace_id OR c.project_id IS DISTINCT FROM p.project_id OR c.business_id IS DISTINCT FROM p.business_id OR (p.workspace_id IS NOT NULL AND public.workspace_role(p.workspace_id) IS NULL) THEN RAISE EXCEPTION 'Proposal context access changed' USING ERRCODE='42501';END IF;
 IF p.status='Completed' THEN RETURN jsonb_build_object('status',p.status,'result',p.result);END IF;
 IF p.status<>'Pending' OR p.expires_at<=now() THEN RAISE EXCEPTION 'Proposal is no longer available';END IF;
 IF NOT p_approve THEN UPDATE public.ai_action_proposals SET status='Cancelled' WHERE id=p_id;INSERT INTO public.ai_action_execution_logs(proposal_id,event) VALUES(p_id,'Cancelled');RETURN jsonb_build_object('status','Cancelled');END IF;
 IF p.workspace_id IS NOT NULL AND coalesce(public.workspace_role(p.workspace_id),'') NOT IN ('owner','admin','member') THEN RAISE EXCEPTION 'Read-only workspace access' USING ERRCODE='42501';END IF;
 IF p.business_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.business_store WHERE id=p.business_id AND user_id=auth.uid()) THEN RAISE EXCEPTION 'Business access changed' USING ERRCODE='42501';END IF;
 UPDATE public.ai_action_proposals SET status='Executing' WHERE id=p_id;INSERT INTO public.ai_action_execution_logs(proposal_id,event) VALUES(p_id,'Approved');
 IF p.kind<>'execution' THEN RETURN jsonb_build_object('status','Executing','plan',p.plan,'cost',p.cost);END IF;
 BEGIN
 IF p.workspace_id IS NULL OR jsonb_typeof(p.plan->'actions') IS DISTINCT FROM 'array' OR jsonb_array_length(p.plan->'actions') NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Invalid action plan';END IF;
 pid:=p.project_id;
 IF pid IS NOT NULL THEN PERFORM 1 FROM public.projects WHERE id=pid AND workspace_id=p.workspace_id FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'Project unavailable';END IF;END IF;
 FOR a IN SELECT value FROM jsonb_array_elements(p.plan->'actions') LOOP
 v:=coalesce(a->'values','{}');
 start_:=nullif(v->>'start_date','')::date;due_:=nullif(v->>'due_date','')::date;
 IF start_ IS NOT NULL AND due_ IS NOT NULL AND due_<start_ THEN RAISE EXCEPTION 'Due date precedes start date';END IF;
 IF a->>'type'='create_project' THEN
 IF pid IS NOT NULL THEN RAISE EXCEPTION 'Select no project before creating a new one';END IF;
 INSERT INTO public.projects(workspace_id,name,description,status,priority,owner_id,created_by,start_date,due_date) VALUES(p.workspace_id,v->>'title',coalesce(v->>'description',''),'Planning',coalesce(v->>'priority','Medium'),auth.uid(),auth.uid(),start_,due_) RETURNING id INTO pid;
 rid:=pid;
 ELSE
 IF pid IS NULL THEN RAISE EXCEPTION 'Select a project';END IF;
 IF a->>'type'='create_task' THEN
 INSERT INTO public.tasks(workspace_id,project_id,title,description,priority,assignee_id,created_by,start_date,due_date,estimated_effort) VALUES(p.workspace_id,pid,v->>'title',coalesce(v->>'description',''),coalesce(v->>'priority','Medium'),nullif(v->>'assignee_id','')::uuid,auth.uid(),start_,due_,nullif(v->>'estimated_effort','')::numeric) RETURNING id INTO tid;rid:=tid;
 ELSIF a->>'type'='update_task' THEN
 tid:=(a->>'record_id')::uuid;ver:=(a->>'version')::integer;
 UPDATE public.tasks SET title=coalesce(v->>'title',title),description=coalesce(v->>'description',description),priority=coalesce(v->>'priority',priority),status=coalesce(v->>'status',status),assignee_id=CASE WHEN v?'assignee_id' THEN nullif(v->>'assignee_id','')::uuid ELSE assignee_id END,start_date=CASE WHEN v?'start_date' THEN start_ ELSE start_date END,due_date=CASE WHEN v?'due_date' THEN due_ ELSE due_date END,estimated_effort=CASE WHEN v?'estimated_effort' THEN nullif(v->>'estimated_effort','')::numeric ELSE estimated_effort END,version=ver WHERE id=tid AND project_id=pid AND version=ver;
 IF NOT FOUND THEN RAISE EXCEPTION 'Task changed elsewhere; regenerate the proposal';END IF;rid:=tid;
 ELSIF a->>'type'='update_project' THEN
 expected:=a->>'updated_at';PERFORM 1 FROM public.projects WHERE id=pid AND updated_at=expected::timestamptz;
 IF NOT FOUND THEN RAISE EXCEPTION 'Project changed elsewhere; regenerate the proposal';END IF;
 UPDATE public.projects SET name=coalesce(v->>'title',name),description=coalesce(v->>'description',description),status=coalesce(v->>'status',status),priority=coalesce(v->>'priority',priority),start_date=CASE WHEN v?'start_date' THEN start_ ELSE start_date END,due_date=CASE WHEN v?'due_date' THEN due_ ELSE due_date END WHERE id=pid;rid:=pid;
 ELSIF a->>'type'='create_milestone' THEN
 IF jsonb_typeof(a->'task_refs') IS DISTINCT FROM 'array' OR jsonb_array_length(a->'task_refs')=0 THEN RAISE EXCEPTION 'Milestone requires task links';END IF;
 INSERT INTO public.milestones(workspace_id,project_id,title,description,created_by,start_date,due_date) VALUES(p.workspace_id,pid,v->>'title',coalesce(v->>'description',''),auth.uid(),start_,due_) RETURNING id INTO mid;
 FOR expected IN SELECT jsonb_array_elements_text(a->'task_refs') LOOP
 tid:=coalesce(ids->>expected,expected)::uuid;
 IF NOT EXISTS(SELECT 1 FROM public.tasks WHERE id=tid AND project_id=pid) THEN RAISE EXCEPTION 'Milestone task is outside the project';END IF;
 INSERT INTO public.milestone_tasks(project_id,milestone_id,task_id) VALUES(pid,mid,tid);
 END LOOP;rid:=mid;
 ELSIF a->>'type'='add_dependency' THEN
 INSERT INTO public.task_dependencies(project_id,predecessor_task_id,successor_task_id,dependency_type,created_by) VALUES(pid,coalesce(ids->>(a->>'predecessor'),a->>'predecessor')::uuid,coalesce(ids->>(a->>'successor'),a->>'successor')::uuid,'FS',auth.uid()) RETURNING id INTO rid;
 ELSIF a->>'type'='add_comment' THEN
 tid:=(a->>'record_id')::uuid;
 IF NOT EXISTS(SELECT 1 FROM public.tasks WHERE id=tid AND project_id=pid) THEN RAISE EXCEPTION 'Task unavailable';END IF;
 INSERT INTO public.task_comments(workspace_id,project_id,task_id,author_id,content) VALUES(p.workspace_id,pid,tid,auth.uid(),v->>'description') RETURNING id INTO rid;
 ELSE RAISE EXCEPTION 'Unsupported action';END IF;
 END IF;
 IF nullif(a->>'ref','') IS NOT NULL THEN IF ids?(a->>'ref') THEN RAISE EXCEPTION 'Duplicate plan reference';END IF;ids:=ids||jsonb_build_object(a->>'ref',rid);END IF;
 receipt:=receipt||jsonb_build_array(jsonb_build_object('type',a->>'type','id',rid,'project_id',pid));
 END LOOP;
 UPDATE public.ai_action_proposals SET status='Completed',result=receipt WHERE id=p_id;
 INSERT INTO public.ai_action_execution_logs(proposal_id,event,details) VALUES(p_id,'Completed',receipt);
 RETURN jsonb_build_object('status','Completed','result',receipt);
 EXCEPTION WHEN OTHERS THEN
 UPDATE public.ai_action_proposals SET status='Failed',error_message=SQLERRM WHERE id=p_id;
 INSERT INTO public.ai_action_execution_logs(proposal_id,event,details) VALUES(p_id,'Failed',jsonb_build_object('message',SQLERRM));
 RETURN jsonb_build_object('status','Failed','error',SQLERRM);
 END;
END $$;
REVOKE ALL ON FUNCTION ai_private.decide_proposal(uuid,boolean) FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION ai_private.decide_proposal(uuid,boolean) TO authenticated;
CREATE FUNCTION public.decide_ai_proposal(p_id uuid,p_approve boolean) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path=public AS $$ SELECT ai_private.decide_proposal(p_id,p_approve) $$;
REVOKE ALL ON FUNCTION public.decide_ai_proposal(uuid,boolean) FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION public.decide_ai_proposal(uuid,boolean) TO authenticated;