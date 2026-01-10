-- Add user_type column to users_profile table
ALTER TABLE public.users_profile 
ADD COLUMN user_type text DEFAULT 'student'::text;

-- Add check constraint for user_type values
ALTER TABLE public.users_profile 
ADD CONSTRAINT users_profile_user_type_check 
CHECK (user_type = ANY (ARRAY['student'::text, 'working_professional'::text, 'founder'::text]));

-- Create index for user_type for better query performance
CREATE INDEX IF NOT EXISTS idx_users_profile_user_type 
ON public.users_profile USING btree (user_type);

-- Update existing records to have default user_type
UPDATE public.users_profile 
SET user_type = 'student' 
WHERE user_type IS NULL;