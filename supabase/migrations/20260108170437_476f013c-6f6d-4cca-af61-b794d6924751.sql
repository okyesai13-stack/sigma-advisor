-- Create skill_validations table
CREATE TABLE public.skill_validations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  career_id text NULL,
  role text NOT NULL,
  domain text NULL,
  readiness_score integer NOT NULL DEFAULT 0,
  matched_skills jsonb NULL DEFAULT '{"strong": [], "partial": []}'::jsonb,
  missing_skills jsonb NULL DEFAULT '[]'::jsonb,
  recommended_next_step text NOT NULL DEFAULT 'learn'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  level text NULL DEFAULT 'intermediate'::text,
  CONSTRAINT skill_validations_pkey PRIMARY KEY (id),
  CONSTRAINT skill_validations_recommended_next_step_check CHECK (
    recommended_next_step = ANY (ARRAY['learn'::text, 'learn_foundation'::text, 'project'::text, 'job'::text])
  )
);

-- Create indexes for skill_validations
CREATE INDEX idx_skill_validations_user_id ON public.skill_validations USING btree (user_id);
CREATE INDEX idx_skill_validations_role ON public.skill_validations USING btree (role);

-- Enable RLS on skill_validations
ALTER TABLE public.skill_validations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for skill_validations
CREATE POLICY "Users can view own skill validations" ON public.skill_validations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skill validations" ON public.skill_validations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own skill validations" ON public.skill_validations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own skill validations" ON public.skill_validations FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at on skill_validations
CREATE TRIGGER update_skill_validations_updated_at
  BEFORE UPDATE ON public.skill_validations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create project_resources table
CREATE TABLE public.project_resources (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  type text NOT NULL,
  resource text NOT NULL,
  name text NOT NULL,
  description text NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_cost numeric(12, 2) NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb NULL,
  CONSTRAINT project_resources_pkey PRIMARY KEY (id),
  CONSTRAINT project_resources_project_id_fkey FOREIGN KEY (project_id) REFERENCES project_ideas (id) ON DELETE CASCADE,
  CONSTRAINT project_resources_type_check CHECK (
    type = ANY (ARRAY['materials'::text, 'software'::text, 'equipment'::text])
  )
);

-- Create indexes for project_resources
CREATE INDEX idx_project_resources_project_id ON public.project_resources USING btree (project_id);
CREATE INDEX idx_project_resources_user_id ON public.project_resources USING btree (user_id);
CREATE INDEX idx_project_resources_type ON public.project_resources USING btree (type);

-- Enable RLS on project_resources
ALTER TABLE public.project_resources ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for project_resources
CREATE POLICY "Users can view own project resources" ON public.project_resources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own project resources" ON public.project_resources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own project resources" ON public.project_resources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own project resources" ON public.project_resources FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at on project_resources
CREATE TRIGGER update_project_resources_updated_at
  BEFORE UPDATE ON public.project_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create resume_versions table
CREATE TABLE public.resume_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  base_resume_id uuid NOT NULL,
  target_role text NULL,
  target_domain text NULL,
  included_skills text[] NULL,
  included_projects uuid[] NULL,
  resume_data jsonb NOT NULL,
  version_name text NULL DEFAULT 'Optimized Resume'::text,
  is_active boolean NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT resume_versions_pkey PRIMARY KEY (id),
  CONSTRAINT resume_versions_base_resume_id_fkey FOREIGN KEY (base_resume_id) REFERENCES resume_analysis (id) ON DELETE CASCADE
);

-- Create indexes for resume_versions
CREATE INDEX idx_resume_versions_user_id ON public.resume_versions USING btree (user_id);
CREATE INDEX idx_resume_versions_active ON public.resume_versions USING btree (user_id, is_active) WHERE is_active = true;

-- Enable RLS on resume_versions
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for resume_versions
CREATE POLICY "Users can view own resume versions" ON public.resume_versions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own resume versions" ON public.resume_versions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own resume versions" ON public.resume_versions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own resume versions" ON public.resume_versions FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at on resume_versions
CREATE TRIGGER update_resume_versions_updated_at
  BEFORE UPDATE ON public.resume_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create interview_preparation table
CREATE TABLE public.interview_preparation (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id uuid NULL,
  role text NULL,
  company text NULL,
  job_analysis jsonb NOT NULL,
  interview_questions jsonb NOT NULL,
  resume_alignment jsonb NULL,
  preparation_checklist jsonb NULL,
  readiness_score integer NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT interview_preparation_pkey PRIMARY KEY (id),
  CONSTRAINT interview_preparation_user_job_unique UNIQUE (user_id, job_id),
  CONSTRAINT interview_preparation_job_id_fkey FOREIGN KEY (job_id) REFERENCES ai_job_recommendations (id) ON DELETE CASCADE
);

-- Create indexes for interview_preparation
CREATE INDEX idx_interview_preparation_user_id ON public.interview_preparation USING btree (user_id);
CREATE INDEX idx_interview_preparation_job_id ON public.interview_preparation USING btree (job_id);

-- Enable RLS on interview_preparation
ALTER TABLE public.interview_preparation ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for interview_preparation
CREATE POLICY "Users can view own interview preparations" ON public.interview_preparation FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interview preparations" ON public.interview_preparation FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own interview preparations" ON public.interview_preparation FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own interview preparations" ON public.interview_preparation FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at on interview_preparation
CREATE TRIGGER update_interview_preparation_updated_at
  BEFORE UPDATE ON public.interview_preparation
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add RLS policies for tables that are missing them
-- Enable RLS on project_build
ALTER TABLE public.project_build ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own project builds" ON public.project_build FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own project builds" ON public.project_build FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own project builds" ON public.project_build FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own project builds" ON public.project_build FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on project_build_steps
ALTER TABLE public.project_build_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own project build steps" ON public.project_build_steps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own project build steps" ON public.project_build_steps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own project build steps" ON public.project_build_steps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own project build steps" ON public.project_build_steps FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on project_detail
ALTER TABLE public.project_detail ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own project details" ON public.project_detail FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own project details" ON public.project_detail FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own project details" ON public.project_detail FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own project details" ON public.project_detail FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on project_ideas
ALTER TABLE public.project_ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own project ideas" ON public.project_ideas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own project ideas" ON public.project_ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own project ideas" ON public.project_ideas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own project ideas" ON public.project_ideas FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on user_learning_journey
ALTER TABLE public.user_learning_journey ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own learning journey" ON public.user_learning_journey FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own learning journey" ON public.user_learning_journey FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own learning journey" ON public.user_learning_journey FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own learning journey" ON public.user_learning_journey FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on resume_career_advice
ALTER TABLE public.resume_career_advice ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own career advice" ON public.resume_career_advice FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own career advice" ON public.resume_career_advice FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own career advice" ON public.resume_career_advice FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own career advice" ON public.resume_career_advice FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on ai_job_recommendations
ALTER TABLE public.ai_job_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own job recommendations" ON public.ai_job_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own job recommendations" ON public.ai_job_recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own job recommendations" ON public.ai_job_recommendations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own job recommendations" ON public.ai_job_recommendations FOR DELETE USING (auth.uid() = user_id);

-- Create sigma_journey_state table for Sigma agent specific state tracking
CREATE TABLE public.sigma_journey_state (
  user_id uuid NOT NULL PRIMARY KEY,
  career_analysis_completed boolean DEFAULT false,
  skill_validation_completed boolean DEFAULT false,
  learning_plan_completed boolean DEFAULT false,
  project_guidance_completed boolean DEFAULT false,
  project_plan_completed boolean DEFAULT false,
  project_build_completed boolean DEFAULT false,
  resume_completed boolean DEFAULT false,
  job_matching_completed boolean DEFAULT false,
  interview_completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on sigma_journey_state
ALTER TABLE public.sigma_journey_state ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sigma_journey_state
CREATE POLICY "Users can view own sigma journey state" ON public.sigma_journey_state FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sigma journey state" ON public.sigma_journey_state FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sigma journey state" ON public.sigma_journey_state FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger for updated_at on sigma_journey_state
CREATE TRIGGER update_sigma_journey_state_updated_at
  BEFORE UPDATE ON public.sigma_journey_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create RPC function to get sigma journey state
CREATE OR REPLACE FUNCTION public.get_sigma_journey_state(p_user_id uuid)
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
    'project_guidance_completed', COALESCE(project_guidance_completed, false),
    'project_plan_completed', COALESCE(project_plan_completed, false),
    'project_build_completed', COALESCE(project_build_completed, false),
    'resume_completed', COALESCE(resume_completed, false),
    'job_matching_completed', COALESCE(job_matching_completed, false),
    'interview_completed', COALESCE(interview_completed, false)
  ) INTO result
  FROM public.sigma_journey_state
  WHERE user_id = p_user_id;
  
  IF result IS NULL THEN
    -- Create default state if not exists
    INSERT INTO public.sigma_journey_state (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    result := jsonb_build_object(
      'career_analysis_completed', false,
      'skill_validation_completed', false,
      'learning_plan_completed', false,
      'project_guidance_completed', false,
      'project_plan_completed', false,
      'project_build_completed', false,
      'resume_completed', false,
      'job_matching_completed', false,
      'interview_completed', false
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Create RPC function to update sigma state flag
CREATE OR REPLACE FUNCTION public.update_sigma_state_flag(
  p_user_id uuid,
  p_flag_name text,
  p_flag_value boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure record exists
  INSERT INTO public.sigma_journey_state (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Update the specific flag
  EXECUTE format('UPDATE public.sigma_journey_state SET %I = $1, updated_at = now() WHERE user_id = $2', p_flag_name)
  USING p_flag_value, p_user_id;
END;
$$;