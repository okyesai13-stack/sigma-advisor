
-- Create job_finder_result table for AI Job Finder Agent
CREATE TABLE public.job_finder_result (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id TEXT NOT NULL,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  
  -- User preferences snapshot
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Job data
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_type TEXT,
  domain TEXT,
  sector TEXT,
  location TEXT,
  work_mode TEXT, -- remote/hybrid/onsite
  salary_range TEXT,
  experience_level TEXT,
  job_description TEXT,
  job_url TEXT,
  source TEXT, -- linkedin/naukri/indeed/company
  
  -- AI scoring
  match_score INTEGER DEFAULT 0,
  match_reasoning TEXT,
  skill_gaps JSONB DEFAULT '[]'::jsonb,
  matched_skills JSONB DEFAULT '[]'::jsonb,
  why_apply TEXT,
  ats_keywords TEXT[] DEFAULT '{}',
  
  -- Status
  is_saved BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_finder_result ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can insert job finder result" ON public.job_finder_result FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read job finder result" ON public.job_finder_result FOR SELECT USING (true);
CREATE POLICY "Anyone can update job finder result" ON public.job_finder_result FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete job finder result" ON public.job_finder_result FOR DELETE USING (true);

-- Index for fast lookups
CREATE INDEX idx_job_finder_result_resume_id ON public.job_finder_result(resume_id);
CREATE INDEX idx_job_finder_result_session_id ON public.job_finder_result(session_id);
