
-- Drop legacy career advisor tables
DROP TABLE IF EXISTS public.ai_role_analysis_result CASCADE;
DROP TABLE IF EXISTS public.career_analysis_result CASCADE;
DROP TABLE IF EXISTS public.career_goal_score_result CASCADE;
DROP TABLE IF EXISTS public.skill_validation_result CASCADE;
DROP TABLE IF EXISTS public.learning_plan_result CASCADE;
DROP TABLE IF EXISTS public.project_ideas_result CASCADE;
DROP TABLE IF EXISTS public.job_matching_result CASCADE;
DROP TABLE IF EXISTS public.journey_state CASCADE;
DROP TABLE IF EXISTS public.sigma_journey_state CASCADE;
DROP TABLE IF EXISTS public.chat_history CASCADE;
DROP TABLE IF EXISTS public.resume_store CASCADE;
DROP FUNCTION IF EXISTS public.get_journey_state(text);
DROP FUNCTION IF EXISTS public.update_journey_state_flag(text, text, boolean);
DROP FUNCTION IF EXISTS public.get_sigma_journey_state(uuid);
DROP FUNCTION IF EXISTS public.update_sigma_state_flag(uuid, text, boolean);

-- Business store: the core entity
CREATE TABLE public.business_store (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_name text NOT NULL,
  pitch text NOT NULL,
  stage text NOT NULL DEFAULT 'idea',
  industry text,
  target_market text,
  geography text,
  raw_context text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_store TO authenticated;
GRANT ALL ON public.business_store TO service_role;
ALTER TABLE public.business_store ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own businesses select" ON public.business_store FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own businesses insert" ON public.business_store FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own businesses update" ON public.business_store FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own businesses delete" ON public.business_store FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Market research agent output
CREATE TABLE public.market_research_result (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_store(id) ON DELETE CASCADE,
  market_size jsonb DEFAULT '{}'::jsonb,
  tam_sam_som jsonb DEFAULT '{}'::jsonb,
  trends jsonb DEFAULT '[]'::jsonb,
  target_audience jsonb DEFAULT '[]'::jsonb,
  opportunities jsonb DEFAULT '[]'::jsonb,
  risks jsonb DEFAULT '[]'::jsonb,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_research_result TO authenticated;
GRANT ALL ON public.market_research_result TO service_role;
ALTER TABLE public.market_research_result ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mr select" ON public.market_research_result FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.business_store b WHERE b.id = business_id AND b.user_id = auth.uid()));
CREATE POLICY "mr write" ON public.market_research_result FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.business_store b WHERE b.id = business_id AND b.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.business_store b WHERE b.id = business_id AND b.user_id = auth.uid()));

-- Competitor analysis agent
CREATE TABLE public.competitor_analysis_result (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_store(id) ON DELETE CASCADE,
  competitors jsonb DEFAULT '[]'::jsonb,
  swot jsonb DEFAULT '{}'::jsonb,
  positioning jsonb DEFAULT '{}'::jsonb,
  differentiation jsonb DEFAULT '[]'::jsonb,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competitor_analysis_result TO authenticated;
GRANT ALL ON public.competitor_analysis_result TO service_role;
ALTER TABLE public.competitor_analysis_result ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ca select" ON public.competitor_analysis_result FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.business_store b WHERE b.id = business_id AND b.user_id = auth.uid()));
CREATE POLICY "ca write" ON public.competitor_analysis_result FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.business_store b WHERE b.id = business_id AND b.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.business_store b WHERE b.id = business_id AND b.user_id = auth.uid()));

-- Business plan agent
CREATE TABLE public.business_plan_result (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_store(id) ON DELETE CASCADE,
  executive_summary text,
  value_proposition text,
  business_model jsonb DEFAULT '{}'::jsonb,
  go_to_market jsonb DEFAULT '{}'::jsonb,
  milestones jsonb DEFAULT '[]'::jsonb,
  risks jsonb DEFAULT '[]'::jsonb,
  team_needs jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_plan_result TO authenticated;
GRANT ALL ON public.business_plan_result TO service_role;
ALTER TABLE public.business_plan_result ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bp select" ON public.business_plan_result FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.business_store b WHERE b.id = business_id AND b.user_id = auth.uid()));
CREATE POLICY "bp write" ON public.business_plan_result FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.business_store b WHERE b.id = business_id AND b.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.business_store b WHERE b.id = business_id AND b.user_id = auth.uid()));

-- Financial model agent
CREATE TABLE public.financial_model_result (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_store(id) ON DELETE CASCADE,
  revenue_streams jsonb DEFAULT '[]'::jsonb,
  cost_structure jsonb DEFAULT '[]'::jsonb,
  projections_3yr jsonb DEFAULT '[]'::jsonb,
  unit_economics jsonb DEFAULT '{}'::jsonb,
  funding_needs jsonb DEFAULT '{}'::jsonb,
  key_assumptions jsonb DEFAULT '[]'::jsonb,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_model_result TO authenticated;
GRANT ALL ON public.financial_model_result TO service_role;
ALTER TABLE public.financial_model_result ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fm select" ON public.financial_model_result FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.business_store b WHERE b.id = business_id AND b.user_id = auth.uid()));
CREATE POLICY "fm write" ON public.financial_model_result FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.business_store b WHERE b.id = business_id AND b.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.business_store b WHERE b.id = business_id AND b.user_id = auth.uid()));

-- Advisor chat history scoped to business
CREATE TABLE public.advisor_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_store(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.advisor_messages TO authenticated;
GRANT ALL ON public.advisor_messages TO service_role;
ALTER TABLE public.advisor_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "am select" ON public.advisor_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.business_store b WHERE b.id = business_id AND b.user_id = auth.uid()));
CREATE POLICY "am write" ON public.advisor_messages FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.business_store b WHERE b.id = business_id AND b.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.business_store b WHERE b.id = business_id AND b.user_id = auth.uid()));

CREATE TRIGGER trg_business_store_updated BEFORE UPDATE ON public.business_store FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
