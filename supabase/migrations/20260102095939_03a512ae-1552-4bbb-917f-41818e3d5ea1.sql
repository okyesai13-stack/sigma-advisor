-- Create user_learning_journey table for AI-generated learning plans
CREATE TABLE public.user_learning_journey (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  career_title text NOT NULL,
  skill_name text NOT NULL,
  
  -- AI-generated content
  learning_steps jsonb DEFAULT '[]'::jsonb,
  recommended_courses jsonb DEFAULT '[]'::jsonb,
  recommended_videos jsonb DEFAULT '[]'::jsonb,
  
  -- User progress
  steps_completed boolean[] DEFAULT '{}',
  
  -- Certification proof
  certification_links text[] DEFAULT '{}',
  
  -- Status control
  status text DEFAULT 'not_started',
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Ensure unique skill per user
  UNIQUE(user_id, skill_name)
);

-- Enable RLS
ALTER TABLE public.user_learning_journey ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own learning journey"
  ON public.user_learning_journey FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning journey"
  ON public.user_learning_journey FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning journey"
  ON public.user_learning_journey FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own learning journey"
  ON public.user_learning_journey FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_learning_journey_updated_at
  BEFORE UPDATE ON public.user_learning_journey
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();