GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_store TO authenticated;
GRANT ALL ON public.business_store TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_research_result TO authenticated;
GRANT ALL ON public.market_research_result TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.competitor_analysis_result TO authenticated;
GRANT ALL ON public.competitor_analysis_result TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_plan_result TO authenticated;
GRANT ALL ON public.business_plan_result TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_model_result TO authenticated;
GRANT ALL ON public.financial_model_result TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.advisor_messages TO authenticated;
GRANT ALL ON public.advisor_messages TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;