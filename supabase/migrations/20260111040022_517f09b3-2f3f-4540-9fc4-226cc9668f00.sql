-- Add profile_completed column to sigma_journey_state
ALTER TABLE public.sigma_journey_state 
ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false;

-- Add user_type column to users_profile
ALTER TABLE public.users_profile 
ADD COLUMN IF NOT EXISTS user_type text;