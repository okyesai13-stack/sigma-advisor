ALTER TABLE public.tasks ADD CONSTRAINT tasks_id_project_unique UNIQUE(id,project_id);
CREATE TABLE public.milestones (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL, project_id uuid NOT NULL, title text NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 300), description text NOT NULL DEFAULT '', owner_id uuid, start_date date, due_date date, status text NOT NULL DEFAULT 'Upcoming' CHECK(status IN ('Upcoming','In Progress','Completed','Delayed')), completion_date timestamptz, completion_override_reason text, created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id), version integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(id,project_id), FOREIGN KEY(project_id,workspace_id) REFERENCES public.projects(id,workspace_id) ON DELETE CASCADE, FOREIGN KEY(workspace_id,owner_id) REFERENCES public.workspace_members(workspace_id,user_id), CHECK(due_date IS NULL OR start_date IS NULL OR due_date>=start_date)
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.milestones TO authenticated; GRANT ALL ON public.milestones TO service_role;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY milestone_read ON public.milestones FOR SELECT TO authenticated USING(public.workspace_role(workspace_id) IS NOT NULL);
CREATE POLICY milestone_create ON public.milestones FOR INSERT TO authenticated WITH CHECK(public.workspace_role(workspace_id) IN ('owner','admin','member') AND created_by=auth.uid());
CREATE POLICY milestone_edit ON public.milestones FOR UPDATE TO authenticated USING(public.workspace_role(workspace_id) IN ('owner','admin','member')) WITH CHECK(public.workspace_role(workspace_id) IN ('owner','admin','member'));
CREATE POLICY milestone_delete ON public.milestones FOR DELETE TO authenticated USING(public.workspace_role(workspace_id) IN ('owner','admin','member'));
CREATE TABLE public.milestone_tasks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE, milestone_id uuid NOT NULL, task_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(milestone_id,task_id), FOREIGN KEY(milestone_id,project_id) REFERENCES public.milestones(id,project_id) ON DELETE CASCADE, FOREIGN KEY(task_id,project_id) REFERENCES public.tasks(id,project_id) ON DELETE CASCADE);
GRANT SELECT,INSERT,DELETE ON public.milestone_tasks TO authenticated; GRANT ALL ON public.milestone_tasks TO service_role;
ALTER TABLE public.milestone_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY milestone_link_read ON public.milestone_tasks FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.projects p WHERE p.id=project_id));
CREATE POLICY milestone_link_create ON public.milestone_tasks FOR INSERT TO authenticated WITH CHECK(EXISTS(SELECT 1 FROM public.projects p WHERE p.id=project_id AND public.workspace_role(p.workspace_id) IN ('owner','admin','member')));
CREATE POLICY milestone_link_delete ON public.milestone_tasks FOR DELETE TO authenticated USING(EXISTS(SELECT 1 FROM public.projects p WHERE p.id=project_id AND public.workspace_role(p.workspace_id) IN ('owner','admin','member')));
CREATE TABLE public.task_dependencies (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE, predecessor_task_id uuid NOT NULL, successor_task_id uuid NOT NULL, dependency_type text NOT NULL DEFAULT 'FS' CHECK(dependency_type IN ('FS','SS','FF','SF')), created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(predecessor_task_id,successor_task_id), CHECK(predecessor_task_id<>successor_task_id), FOREIGN KEY(predecessor_task_id,project_id) REFERENCES public.tasks(id,project_id) ON DELETE CASCADE, FOREIGN KEY(successor_task_id,project_id) REFERENCES public.tasks(id,project_id) ON DELETE CASCADE);
GRANT SELECT,INSERT,DELETE ON public.task_dependencies TO authenticated; GRANT ALL ON public.task_dependencies TO service_role;
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY dependency_read ON public.task_dependencies FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.projects p WHERE p.id=project_id));
CREATE POLICY dependency_create ON public.task_dependencies FOR INSERT TO authenticated WITH CHECK(created_by=auth.uid() AND EXISTS(SELECT 1 FROM public.projects p WHERE p.id=project_id AND public.workspace_role(p.workspace_id) IN ('owner','admin','member')));
CREATE POLICY dependency_delete ON public.task_dependencies FOR DELETE TO authenticated USING(EXISTS(SELECT 1 FROM public.projects p WHERE p.id=project_id AND public.workspace_role(p.workspace_id) IN ('owner','admin','member')));
CREATE TABLE public.project_schedule_activity (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE, project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE, actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, event text NOT NULL, title text NOT NULL, changes jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.project_schedule_activity TO authenticated; GRANT ALL ON public.project_schedule_activity TO service_role;
ALTER TABLE public.project_schedule_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY scheduling_activity_read ON public.project_schedule_activity FOR SELECT TO authenticated USING(public.workspace_role(workspace_id) IS NOT NULL);
CREATE INDEX milestones_workspace_due ON public.milestones(workspace_id,due_date);
CREATE INDEX milestones_project ON public.milestones(project_id);
CREATE INDEX milestone_tasks_task ON public.milestone_tasks(task_id);
CREATE INDEX dependencies_project ON public.task_dependencies(project_id);
CREATE INDEX dependencies_successor ON public.task_dependencies(successor_task_id);
CREATE INDEX schedule_activity_workspace ON public.project_schedule_activity(workspace_id,created_at DESC);
CREATE FUNCTION public.validate_dependency() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 PERFORM 1 FROM public.projects WHERE id=NEW.project_id FOR UPDATE;
 IF NEW.dependency_type<>'FS' THEN RAISE EXCEPTION 'Only Finish to Start is supported in this phase'; END IF;
 IF EXISTS(WITH RECURSIVE reachable(id) AS (SELECT NEW.successor_task_id UNION SELECT d.successor_task_id FROM public.task_dependencies d JOIN reachable r ON d.predecessor_task_id=r.id WHERE d.project_id=NEW.project_id) SELECT 1 FROM reachable WHERE id=NEW.predecessor_task_id) THEN RAISE EXCEPTION 'Circular dependency is not allowed'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER dependency_validate BEFORE INSERT ON public.task_dependencies FOR EACH ROW EXECUTE FUNCTION public.validate_dependency();
CREATE FUNCTION public.guard_milestone() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 PERFORM 1 FROM public.projects WHERE id=NEW.project_id FOR UPDATE;
 IF TG_OP='UPDATE' THEN
  IF NEW.workspace_id<>OLD.workspace_id OR NEW.project_id<>OLD.project_id OR NEW.created_by<>OLD.created_by THEN RAISE EXCEPTION 'Milestone project and creator are immutable'; END IF;
  IF NEW.version<>OLD.version THEN RAISE EXCEPTION 'Milestone changed elsewhere; refresh first'; END IF;
  NEW.version:=OLD.version+1;
 END IF;
 IF NEW.status='Completed' AND (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM NEW.status OR NEW.completion_override_reason IS DISTINCT FROM OLD.completion_override_reason) THEN
  IF EXISTS(SELECT 1 FROM public.milestone_tasks l JOIN public.tasks t ON t.id=l.task_id WHERE l.milestone_id=NEW.id AND t.status<>'done') THEN
   IF public.workspace_role(NEW.workspace_id) NOT IN ('owner','admin') OR public.workspace_role(NEW.workspace_id) IS NULL OR length(trim(coalesce(NEW.completion_override_reason,'')))<5 THEN RAISE EXCEPTION 'Incomplete linked tasks require an owner/admin override with a reason'; END IF;
  ELSE NEW.completion_override_reason:=NULL; END IF;
  NEW.completion_date:=now();
 ELSIF NEW.status<>'Completed' THEN NEW.completion_date:=NULL; NEW.completion_override_reason:=NULL;
 ELSE NEW.completion_date:=OLD.completion_date;
 END IF;
 NEW.updated_at:=now(); RETURN NEW;
END $$;
CREATE TRIGGER milestone_guard BEFORE INSERT OR UPDATE ON public.milestones FOR EACH ROW EXECUTE FUNCTION public.guard_milestone();
CREATE FUNCTION public.guard_milestone_link() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE m public.milestones; s text;
BEGIN
 SELECT * INTO m FROM public.milestones WHERE id=NEW.milestone_id FOR UPDATE;
 SELECT status INTO s FROM public.tasks WHERE id=NEW.task_id;
 IF m.status='Completed' AND s<>'done' THEN RAISE EXCEPTION 'Reopen the completed milestone before linking incomplete tasks'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER milestone_link_guard BEFORE INSERT ON public.milestone_tasks FOR EACH ROW EXECUTE FUNCTION public.guard_milestone_link();
CREATE FUNCTION public.log_schedule_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r jsonb; pid uuid; wid uuid; label text; e text;
BEGIN
 r:=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
 pid:=(r->>'project_id')::uuid;
 SELECT workspace_id INTO wid FROM public.projects WHERE id=pid;
 IF wid IS NULL THEN RETURN COALESCE(NEW,OLD); END IF;
 label:=coalesce(r->>'title',r->>'task_id',r->>'successor_task_id','Schedule');
 e:=TG_TABLE_NAME||' '||lower(TG_OP);
 IF TG_TABLE_NAME='milestones' AND r->>'status'='Completed' AND nullif(r->>'completion_override_reason','') IS NOT NULL THEN e:='Milestone completion override'; END IF;
 INSERT INTO public.project_schedule_activity(workspace_id,project_id,actor_id,event,title,changes) VALUES(wid,pid,auth.uid(),e,label,jsonb_build_object('before',CASE WHEN TG_OP='INSERT' THEN NULL ELSE to_jsonb(OLD) END,'after',CASE WHEN TG_OP='DELETE' THEN NULL ELSE to_jsonb(NEW) END));
 RETURN COALESCE(NEW,OLD);
END $$;
CREATE TRIGGER milestone_activity AFTER INSERT OR UPDATE OR DELETE ON public.milestones FOR EACH ROW EXECUTE FUNCTION public.log_schedule_change();
CREATE TRIGGER milestone_link_activity AFTER INSERT OR DELETE ON public.milestone_tasks FOR EACH ROW EXECUTE FUNCTION public.log_schedule_change();
CREATE TRIGGER dependency_activity AFTER INSERT OR DELETE ON public.task_dependencies FOR EACH ROW EXECUTE FUNCTION public.log_schedule_change();
CREATE TRIGGER task_schedule_activity AFTER UPDATE OF start_date,due_date ON public.tasks FOR EACH ROW WHEN(OLD.start_date IS DISTINCT FROM NEW.start_date OR OLD.due_date IS DISTINCT FROM NEW.due_date) EXECUTE FUNCTION public.log_schedule_change();
CREATE FUNCTION public.save_milestone(p_values jsonb,p_task_ids uuid[],p_id uuid DEFAULT NULL,p_version integer DEFAULT 0) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE mid uuid; pid uuid; wid uuid; m public.milestones;
BEGIN
 pid:=(p_values->>'project_id')::uuid;
 SELECT workspace_id INTO wid FROM public.projects WHERE id=pid FOR UPDATE;
 IF auth.uid() IS NULL OR public.workspace_role(wid) IS NULL OR public.workspace_role(wid) NOT IN ('owner','admin','member') THEN RAISE EXCEPTION 'Not authorized'; END IF;
 IF EXISTS(SELECT 1 FROM unnest(p_task_ids) tid WHERE NOT EXISTS(SELECT 1 FROM public.tasks WHERE id=tid AND project_id=pid)) THEN RAISE EXCEPTION 'Linked tasks must belong to this project'; END IF;
 IF p_id IS NULL THEN
  INSERT INTO public.milestones(workspace_id,project_id,title,description,owner_id,start_date,due_date,created_by) VALUES(wid,pid,trim(p_values->>'title'),coalesce(p_values->>'description',''),nullif(p_values->>'owner_id','')::uuid,nullif(p_values->>'start_date','')::date,nullif(p_values->>'due_date','')::date,auth.uid()) RETURNING id INTO mid;
 ELSE
  SELECT * INTO m FROM public.milestones WHERE id=p_id AND project_id=pid FOR UPDATE;
  IF m.id IS NULL OR m.version<>p_version THEN RAISE EXCEPTION 'Milestone changed elsewhere; refresh first'; END IF;
  mid:=m.id;
  IF m.status='Completed' THEN UPDATE public.milestones SET status='In Progress',version=m.version WHERE id=mid; END IF;
 END IF;
 DELETE FROM public.milestone_tasks WHERE milestone_id=mid AND NOT(task_id=ANY(p_task_ids));
 INSERT INTO public.milestone_tasks(milestone_id,project_id,task_id) SELECT mid,pid,tid FROM (SELECT DISTINCT unnest(p_task_ids) tid) q ON CONFLICT(milestone_id,task_id) DO NOTHING;
 UPDATE public.milestones SET title=trim(p_values->>'title'),description=coalesce(p_values->>'description',''),owner_id=nullif(p_values->>'owner_id','')::uuid,start_date=nullif(p_values->>'start_date','')::date,due_date=nullif(p_values->>'due_date','')::date,status=coalesce(p_values->>'status','Upcoming'),completion_override_reason=nullif(p_values->>'completion_override_reason',''),version=(SELECT version FROM public.milestones WHERE id=mid) WHERE id=mid;
 RETURN mid;
END $$;
REVOKE ALL ON FUNCTION public.save_milestone(jsonb,uuid[],uuid,integer) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.save_milestone(jsonb,uuid[],uuid,integer) TO authenticated;
REVOKE ALL ON FUNCTION public.validate_dependency(), public.guard_milestone(), public.guard_milestone_link(), public.log_schedule_change() FROM PUBLIC;