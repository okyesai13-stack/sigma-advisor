-- Remove FK to auth.users to prevent profile creation failures during auth race conditions
ALTER TABLE public.users_profile
DROP CONSTRAINT IF EXISTS users_profile_id_fkey;