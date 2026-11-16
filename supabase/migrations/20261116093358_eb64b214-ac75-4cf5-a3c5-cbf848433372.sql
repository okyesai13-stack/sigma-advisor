DROP POLICY attachments_read ON public.attachments;
CREATE POLICY attachments_read ON public.attachments FOR SELECT TO authenticated USING(public.workspace_role(workspace_id) IS NOT NULL AND (status='Ready' OR uploaded_by=auth.uid() OR public.workspace_role(workspace_id) IN ('owner','admin')));
CREATE FUNCTION public.team_directory(p_workspace uuid) RETURNS TABLE(user_id uuid,role text,full_name text,email text,avatar_url text,joined_at timestamptz) LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$ SELECT wm.user_id,wm.role,p.full_name,p.email,p.avatar_url,wm.created_at FROM public.workspace_members wm JOIN public.profiles p ON p.id=wm.user_id WHERE wm.workspace_id=p_workspace AND public.workspace_role(p_workspace) IS NOT NULL $$;
ALTER FUNCTION public.team_directory(uuid) SET SCHEMA collaboration_private;
REVOKE ALL ON FUNCTION collaboration_private.team_directory(uuid) FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION collaboration_private.team_directory(uuid) TO authenticated;
CREATE FUNCTION public.team_directory(p_workspace uuid) RETURNS TABLE(user_id uuid,role text,full_name text,email text,avatar_url text,joined_at timestamptz) LANGUAGE sql SECURITY INVOKER SET search_path=public AS $$ SELECT * FROM collaboration_private.team_directory(p_workspace) $$;
REVOKE ALL ON FUNCTION public.team_directory(uuid) FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION public.team_directory(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION collaboration_private.accept_workspace_invitation(p_token text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE inv public.workspace_invitations;address text;confirmed timestamptz;sender_role text;BEGIN
 IF auth.uid() IS NULL OR length(coalesce(p_token,''))<>64 THEN RAISE EXCEPTION 'Invalid invitation';END IF;
 SELECT email,email_confirmed_at INTO address,confirmed FROM auth.users WHERE id=auth.uid();
 SELECT * INTO inv FROM public.workspace_invitations WHERE token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') FOR UPDATE;
 SELECT role INTO sender_role FROM public.workspace_members WHERE workspace_id=inv.workspace_id AND user_id=inv.invited_by;
 IF inv.id IS NULL OR inv.status<>'Pending' OR inv.expires_at<=now() OR confirmed IS NULL OR lower(address)<>lower(inv.email) OR sender_role IS NULL OR sender_role NOT IN ('owner','admin') OR (inv.role='admin' AND sender_role<>'owner') THEN RAISE EXCEPTION 'Invitation invalid, expired, used, or for another email';END IF;
 IF inv.role='admin' AND public.workspace_role(inv.workspace_id) IS NOT NULL THEN RAISE EXCEPTION 'Existing members must have their roles managed by the owner';END IF;
 INSERT INTO public.workspace_members(workspace_id,user_id,role) VALUES(inv.workspace_id,auth.uid(),inv.role) ON CONFLICT(workspace_id,user_id) DO NOTHING;
 UPDATE public.workspace_invitations SET status='Accepted',accepted_by=auth.uid(),updated_at=now() WHERE id=inv.id;
 PERFORM public.enqueue_notification(inv.workspace_id,inv.invited_by,'invitation','Invitation accepted',inv.email||' joined the workspace','/team','accepted:'||inv.id);
 RETURN inv.workspace_id;END $$;