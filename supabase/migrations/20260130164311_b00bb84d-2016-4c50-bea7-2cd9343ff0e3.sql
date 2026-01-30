-- Create mock interview session table
CREATE TABLE public.mock_interview_session (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id text NOT NULL,
  job_id uuid REFERENCES public.job_matching_result(id),
  job_title text NOT NULL,
  company_name text NOT NULL,
  interview_type text NOT NULL DEFAULT 'technical',
  status text NOT NULL DEFAULT 'in_progress',
  total_questions integer DEFAULT 5,
  current_question_index integer DEFAULT 0,
  questions jsonb DEFAULT '[]'::jsonb,
  answers jsonb DEFAULT '[]'::jsonb,
  overall_score integer DEFAULT 0,
  overall_feedback text,
  strengths text[],
  improvements text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.mock_interview_session ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can insert mock interview session" 
ON public.mock_interview_session 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can read mock interview session" 
ON public.mock_interview_session 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update mock interview session" 
ON public.mock_interview_session 
FOR UPDATE 
USING (true);

-- Create career trajectory result table
CREATE TABLE public.career_trajectory_result (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id text NOT NULL,
  trajectory_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  salary_projections jsonb DEFAULT '[]'::jsonb,
  skill_milestones jsonb DEFAULT '[]'::jsonb,
  industry_insights jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.career_trajectory_result ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can insert career trajectory" 
ON public.career_trajectory_result 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can read career trajectory" 
ON public.career_trajectory_result 
FOR SELECT 
USING (true);