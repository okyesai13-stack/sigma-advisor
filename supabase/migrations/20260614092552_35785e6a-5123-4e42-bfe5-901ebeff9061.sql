-- 1. Drop overly permissive profiles INSERT policy.
-- The handle_new_user trigger is SECURITY DEFINER and bypasses RLS, so no policy is needed.
DROP POLICY IF EXISTS "Allow trigger insert" ON public.profiles;

-- 2. Revoke EXECUTE on internal SECURITY DEFINER / trigger functions from anon and authenticated.
-- These are only meant to be invoked by the database (triggers), not via the Data API / RPC.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;