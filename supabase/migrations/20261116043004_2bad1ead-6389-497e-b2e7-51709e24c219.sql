REVOKE EXECUTE ON FUNCTION public.workspace_role(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_workspace(text,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.manage_workspace_member(uuid,text,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.workspace_roster(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.duplicate_project(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.log_task_change() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.workspace_role(uuid),public.create_workspace(text,text),public.manage_workspace_member(uuid,text,text),public.workspace_roster(uuid),public.duplicate_project(uuid) TO authenticated;