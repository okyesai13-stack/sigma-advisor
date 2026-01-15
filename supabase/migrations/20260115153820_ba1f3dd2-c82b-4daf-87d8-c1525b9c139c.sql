-- Add display_name column to users_profile table
ALTER TABLE public.users_profile 
ADD COLUMN IF NOT EXISTS display_name TEXT;