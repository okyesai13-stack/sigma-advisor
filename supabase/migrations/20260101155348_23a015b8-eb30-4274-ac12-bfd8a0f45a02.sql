-- =============================================
-- AI CAREER ADVISOR - COMPLETE BACKEND SCHEMA
-- =============================================

-- 1. USERS PROFILE
CREATE TABLE public.users_profile (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type text CHECK (goal_type IN ('learn', 'job', 'startup')),
  goal_description text,
  interests text[],
  hobbies text[],
  activities text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. EDUCATION DETAILS
CREATE TABLE public.education_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  degree text,
  field text,
  institution text,
  graduation_year int,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. EXPERIENCE DETAILS
CREATE TABLE public.experience_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company text,
  role text,
  skills text[],
  start_year int,
  end_year int,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. CERTIFICATIONS
CREATE TABLE public.certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text,
  issuer text,
  year int,
  created_at timestamp with time zone DEFAULT now()
);

-- 5. CAREER RECOMMENDATIONS
CREATE TABLE public.career_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  career_title text NOT NULL,
  rationale text,
  confidence_score numeric,
  created_at timestamp with time zone DEFAULT now()
);

-- 6. SELECTED CAREER (one active per user)
CREATE TABLE public.selected_career (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  career_title text NOT NULL,
  industry text,
  selected_at timestamp with time zone DEFAULT now()
);

-- 7. SKILL CATALOG (reference table)
CREATE TABLE public.skill_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name text NOT NULL UNIQUE,
  category text,
  description text
);

-- 8. USER SKILL VALIDATION
CREATE TABLE public.user_skill_validation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  career_title text NOT NULL,
  skill_name text NOT NULL,
  required_level text,
  current_level text,
  status text CHECK (status IN ('ready', 'gap')) DEFAULT 'gap',
  created_at timestamp with time zone DEFAULT now()
);

-- 9. LEARNING PLAN
CREATE TABLE public.learning_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill_name text NOT NULL,
  priority int DEFAULT 1,
  status text CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now()
);

-- 10. PROJECTS (reference/template table)
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  career_title text NOT NULL,
  project_title text NOT NULL,
  difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  skills_covered text[],
  description text
);

-- 11. USER PROJECTS
CREATE TABLE public.user_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  status text CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, project_id)
);

-- 12. JOB READINESS
CREATE TABLE public.job_readiness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  resume_ready boolean DEFAULT false,
  portfolio_ready boolean DEFAULT false,
  confidence_level int DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now()
);

-- 13. AI INTERVIEWS
CREATE TABLE public.ai_interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  interview_type text CHECK (interview_type IN ('technical', 'hr', 'behavioral')),
  feedback text,
  score numeric,
  created_at timestamp with time zone DEFAULT now()
);

-- 14. ADVISOR CONVERSATIONS
CREATE TABLE public.advisor_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text CHECK (role IN ('user', 'advisor')) NOT NULL,
  message text NOT NULL,
  context jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- 15. USER JOURNEY STATE
CREATE TABLE public.user_journey_state (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_completed boolean DEFAULT false,
  career_recommended boolean DEFAULT false,
  career_selected boolean DEFAULT false,
  skill_validated boolean DEFAULT false,
  learning_completed boolean DEFAULT false,
  projects_completed boolean DEFAULT false,
  job_ready boolean DEFAULT false,
  interview_completed boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_education_user ON public.education_details(user_id);
CREATE INDEX idx_experience_user ON public.experience_details(user_id);
CREATE INDEX idx_certifications_user ON public.certifications(user_id);
CREATE INDEX idx_career_rec_user ON public.career_recommendations(user_id);
CREATE INDEX idx_skill_validation_user ON public.user_skill_validation(user_id);
CREATE INDEX idx_learning_plan_user ON public.learning_plan(user_id);
CREATE INDEX idx_user_projects_user ON public.user_projects(user_id);
CREATE INDEX idx_interviews_user ON public.ai_interviews(user_id);
CREATE INDEX idx_conversations_user ON public.advisor_conversations(user_id);
CREATE INDEX idx_conversations_created ON public.advisor_conversations(created_at);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.selected_career ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skill_validation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_readiness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_journey_state ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - USERS CAN ONLY ACCESS OWN DATA
-- =============================================

-- users_profile policies
CREATE POLICY "Users can view own profile" ON public.users_profile FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users_profile FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users_profile FOR UPDATE USING (auth.uid() = id);

-- education_details policies
CREATE POLICY "Users can view own education" ON public.education_details FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own education" ON public.education_details FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own education" ON public.education_details FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own education" ON public.education_details FOR DELETE USING (auth.uid() = user_id);

-- experience_details policies
CREATE POLICY "Users can view own experience" ON public.experience_details FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own experience" ON public.experience_details FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own experience" ON public.experience_details FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own experience" ON public.experience_details FOR DELETE USING (auth.uid() = user_id);

-- certifications policies
CREATE POLICY "Users can view own certifications" ON public.certifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own certifications" ON public.certifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own certifications" ON public.certifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own certifications" ON public.certifications FOR DELETE USING (auth.uid() = user_id);

-- career_recommendations policies
CREATE POLICY "Users can view own recommendations" ON public.career_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert recommendations" ON public.career_recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- selected_career policies
CREATE POLICY "Users can view own selected career" ON public.selected_career FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own selected career" ON public.selected_career FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own selected career" ON public.selected_career FOR UPDATE USING (auth.uid() = user_id);

-- skill_catalog policies (public read)
CREATE POLICY "Anyone can view skill catalog" ON public.skill_catalog FOR SELECT USING (true);

-- user_skill_validation policies
CREATE POLICY "Users can view own skill validation" ON public.user_skill_validation FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skill validation" ON public.user_skill_validation FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own skill validation" ON public.user_skill_validation FOR UPDATE USING (auth.uid() = user_id);

-- learning_plan policies
CREATE POLICY "Users can view own learning plan" ON public.learning_plan FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own learning plan" ON public.learning_plan FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own learning plan" ON public.learning_plan FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own learning plan" ON public.learning_plan FOR DELETE USING (auth.uid() = user_id);

-- projects policies (public read)
CREATE POLICY "Anyone can view projects" ON public.projects FOR SELECT USING (true);

-- user_projects policies
CREATE POLICY "Users can view own user projects" ON public.user_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user projects" ON public.user_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user projects" ON public.user_projects FOR UPDATE USING (auth.uid() = user_id);

-- job_readiness policies
CREATE POLICY "Users can view own job readiness" ON public.job_readiness FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own job readiness" ON public.job_readiness FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own job readiness" ON public.job_readiness FOR UPDATE USING (auth.uid() = user_id);

-- ai_interviews policies
CREATE POLICY "Users can view own interviews" ON public.ai_interviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interviews" ON public.ai_interviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- advisor_conversations policies
CREATE POLICY "Users can view own conversations" ON public.advisor_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations" ON public.advisor_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_journey_state policies
CREATE POLICY "Users can view own journey state" ON public.user_journey_state FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journey state" ON public.user_journey_state FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journey state" ON public.user_journey_state FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- TRIGGER FOR UPDATED_AT TIMESTAMPS
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_users_profile_updated_at
  BEFORE UPDATE ON public.users_profile
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_readiness_updated_at
  BEFORE UPDATE ON public.job_readiness
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journey_state_updated_at
  BEFORE UPDATE ON public.user_journey_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- AUTO-CREATE PROFILE & JOURNEY STATE ON SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_profile (id) VALUES (NEW.id);
  INSERT INTO public.user_journey_state (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();