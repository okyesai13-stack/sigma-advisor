
-- Create career_goal_score_result table
CREATE TABLE public.career_goal_score_result (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id text NOT NULL,
  goal_score integer,
  score_breakdown jsonb DEFAULT '{}'::jsonb,
  recommendations jsonb DEFAULT '[]'::jsonb,
  ninety_day_plan jsonb DEFAULT '{}'::jsonb,
  target_role text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.career_goal_score_result ENABLE ROW LEVEL SECURITY;

-- Public insert/select policies (matching existing pattern)
CREATE POLICY "Anyone can insert career goal score"
  ON public.career_goal_score_result FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read career goal score"
  ON public.career_goal_score_result FOR SELECT
  USING (true);

-- Add goal_score_completed to journey_state
ALTER TABLE public.journey_state ADD COLUMN IF NOT EXISTS goal_score_completed boolean DEFAULT false;
