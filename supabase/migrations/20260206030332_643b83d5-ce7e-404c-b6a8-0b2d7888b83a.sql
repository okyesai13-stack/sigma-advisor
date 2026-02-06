-- Create AI Role Analysis Result table
CREATE TABLE public.ai_role_analysis_result (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id TEXT NOT NULL REFERENCES public.resume_store(resume_id) ON DELETE CASCADE,
  roles_at_risk JSONB DEFAULT '[]'::jsonb,
  ai_enhanced_roles JSONB DEFAULT '[]'::jsonb,
  current_ai_ready_skills TEXT[] DEFAULT '{}',
  skills_to_acquire JSONB DEFAULT '[]'::jsonb,
  preparation_roadmap JSONB DEFAULT '{}'::jsonb,
  overall_ai_readiness_score INTEGER DEFAULT 0,
  key_insights TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_role_analysis_result ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required)
CREATE POLICY "Allow public insert on ai_role_analysis_result"
ON public.ai_role_analysis_result
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public select on ai_role_analysis_result"
ON public.ai_role_analysis_result
FOR SELECT
USING (true);

CREATE POLICY "Allow public update on ai_role_analysis_result"
ON public.ai_role_analysis_result
FOR UPDATE
USING (true);

-- Add ai_role_analysis_completed flag to journey_state
ALTER TABLE public.journey_state 
ADD COLUMN IF NOT EXISTS ai_role_analysis_completed BOOLEAN DEFAULT false;

-- Create index for faster lookups
CREATE INDEX idx_ai_role_analysis_resume_id ON public.ai_role_analysis_result(resume_id);