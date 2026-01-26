-- Add complexity column to project_ideas_result
ALTER TABLE public.project_ideas_result ADD COLUMN IF NOT EXISTS complexity text DEFAULT 'intermediate';
ALTER TABLE public.project_ideas_result ADD COLUMN IF NOT EXISTS skills_demonstrated text[] DEFAULT '{}';
ALTER TABLE public.project_ideas_result ADD COLUMN IF NOT EXISTS estimated_time text;

-- Add is_saved column to job_matching_result
ALTER TABLE public.job_matching_result ADD COLUMN IF NOT EXISTS is_saved boolean DEFAULT false;

-- Add job_url column to job_matching_result
ALTER TABLE public.job_matching_result ADD COLUMN IF NOT EXISTS job_url text;

-- Create smart_analysis_result table
CREATE TABLE IF NOT EXISTS public.smart_analysis_result (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id text NOT NULL REFERENCES public.resume_store(resume_id),
  job_id uuid NOT NULL REFERENCES public.job_matching_result(id),
  company_analysis jsonb DEFAULT '{}',
  role_analysis jsonb DEFAULT '{}',
  resume_fit_analysis jsonb DEFAULT '{}',
  recommendations text[],
  overall_score integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for smart_analysis_result
ALTER TABLE public.smart_analysis_result ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert smart analysis" ON public.smart_analysis_result FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read smart analysis" ON public.smart_analysis_result FOR SELECT USING (true);

-- Create interview_preparation_result table for resume_id based flow
CREATE TABLE IF NOT EXISTS public.interview_preparation_result (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id text NOT NULL REFERENCES public.resume_store(resume_id),
  job_id uuid NOT NULL REFERENCES public.job_matching_result(id),
  job_title text NOT NULL,
  company_name text NOT NULL,
  technical_questions jsonb DEFAULT '[]',
  behavioral_questions jsonb DEFAULT '[]',
  company_specific_questions jsonb DEFAULT '[]',
  preparation_tips text[],
  key_talking_points text[],
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for interview_preparation_result
ALTER TABLE public.interview_preparation_result ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert interview prep" ON public.interview_preparation_result FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read interview prep" ON public.interview_preparation_result FOR SELECT USING (true);

-- Update job_matching_result RLS to allow updates
CREATE POLICY "Anyone can update job matching" ON public.job_matching_result FOR UPDATE USING (true);