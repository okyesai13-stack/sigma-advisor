-- Create new resume_store table (primary identity for no-auth flow)
CREATE TABLE public.resume_store (
  resume_id TEXT PRIMARY KEY DEFAULT 'res_' || substr(gen_random_uuid()::text, 1, 12),
  resume_file_url TEXT,
  resume_text TEXT,
  parsed_data JSONB,
  goal TEXT,
  goal_type TEXT DEFAULT 'job',
  user_type TEXT DEFAULT 'student',
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow public access (no auth required)
ALTER TABLE public.resume_store ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public access)
CREATE POLICY "Anyone can insert resume" 
ON public.resume_store 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to read their resume by resume_id
CREATE POLICY "Anyone can read resume by id" 
ON public.resume_store 
FOR SELECT 
USING (true);

-- Allow anyone to update their resume
CREATE POLICY "Anyone can update resume" 
ON public.resume_store 
FOR UPDATE 
USING (true);

-- Create career_analysis_result table
CREATE TABLE public.career_analysis_result (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id TEXT NOT NULL REFERENCES public.resume_store(resume_id) ON DELETE CASCADE,
  career_roles JSONB NOT NULL DEFAULT '[]',
  skill_analysis JSONB,
  career_roadmap JSONB,
  overall_assessment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS with public access
ALTER TABLE public.career_analysis_result ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert career analysis" 
ON public.career_analysis_result 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can read career analysis" 
ON public.career_analysis_result 
FOR SELECT 
USING (true);

-- Create skill_validation_result table
CREATE TABLE public.skill_validation_result (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id TEXT NOT NULL REFERENCES public.resume_store(resume_id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  matched_skills JSONB DEFAULT '{"strong": [], "partial": []}',
  missing_skills JSONB DEFAULT '[]',
  readiness_score INTEGER DEFAULT 0,
  recommended_next_step TEXT DEFAULT 'learn',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.skill_validation_result ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert skill validation" 
ON public.skill_validation_result 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can read skill validation" 
ON public.skill_validation_result 
FOR SELECT 
USING (true);

-- Create learning_plan_result table
CREATE TABLE public.learning_plan_result (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id TEXT NOT NULL REFERENCES public.resume_store(resume_id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  career_title TEXT,
  learning_steps JSONB DEFAULT '[]',
  recommended_courses JSONB DEFAULT '[]',
  recommended_videos JSONB DEFAULT '[]',
  status TEXT DEFAULT 'not_started',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_plan_result ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert learning plan" 
ON public.learning_plan_result 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can read learning plan" 
ON public.learning_plan_result 
FOR SELECT 
USING (true);

-- Create project_ideas_result table
CREATE TABLE public.project_ideas_result (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id TEXT NOT NULL REFERENCES public.resume_store(resume_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  problem TEXT,
  domain TEXT,
  budget NUMERIC DEFAULT 15000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_ideas_result ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert project ideas" 
ON public.project_ideas_result 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can read project ideas" 
ON public.project_ideas_result 
FOR SELECT 
USING (true);

-- Create job_matching_result table
CREATE TABLE public.job_matching_result (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id TEXT NOT NULL REFERENCES public.resume_store(resume_id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  career_role TEXT NOT NULL,
  job_description TEXT,
  location TEXT,
  relevance_score DOUBLE PRECISION DEFAULT 0,
  skill_tags TEXT[],
  required_skills TEXT[],
  job_link TEXT,
  domain TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.job_matching_result ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert job matching" 
ON public.job_matching_result 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can read job matching" 
ON public.job_matching_result 
FOR SELECT 
USING (true);

-- Create journey_state table for tracking progress
CREATE TABLE public.journey_state (
  resume_id TEXT PRIMARY KEY REFERENCES public.resume_store(resume_id) ON DELETE CASCADE,
  career_analysis_completed BOOLEAN DEFAULT false,
  skill_validation_completed BOOLEAN DEFAULT false,
  learning_plan_completed BOOLEAN DEFAULT false,
  project_ideas_completed BOOLEAN DEFAULT false,
  job_matching_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.journey_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert journey state" 
ON public.journey_state 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can read journey state" 
ON public.journey_state 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update journey state" 
ON public.journey_state 
FOR UPDATE 
USING (true);

-- Create function to get journey state
CREATE OR REPLACE FUNCTION public.get_journey_state(p_resume_id TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'career_analysis_completed', COALESCE(career_analysis_completed, false),
    'skill_validation_completed', COALESCE(skill_validation_completed, false),
    'learning_plan_completed', COALESCE(learning_plan_completed, false),
    'project_ideas_completed', COALESCE(project_ideas_completed, false),
    'job_matching_completed', COALESCE(job_matching_completed, false)
  ) INTO result
  FROM public.journey_state
  WHERE resume_id = p_resume_id;
  
  IF result IS NULL THEN
    -- Create default state if not exists
    INSERT INTO public.journey_state (resume_id)
    VALUES (p_resume_id)
    ON CONFLICT (resume_id) DO NOTHING;
    
    result := jsonb_build_object(
      'career_analysis_completed', false,
      'skill_validation_completed', false,
      'learning_plan_completed', false,
      'project_ideas_completed', false,
      'job_matching_completed', false
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Create function to update journey state flag
CREATE OR REPLACE FUNCTION public.update_journey_state_flag(p_resume_id TEXT, p_flag_name TEXT, p_flag_value BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure record exists
  INSERT INTO public.journey_state (resume_id)
  VALUES (p_resume_id)
  ON CONFLICT (resume_id) DO NOTHING;
  
  -- Update the specific flag
  EXECUTE format('UPDATE public.journey_state SET %I = $1, updated_at = now() WHERE resume_id = $2', p_flag_name)
  USING p_flag_value, p_resume_id;
END;
$$;