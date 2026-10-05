CREATE TABLE public.marketing_strategy_result (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_store(id) ON DELETE CASCADE,
  summary text,
  positioning jsonb DEFAULT '{}'::jsonb,
  personas jsonb DEFAULT '[]'::jsonb,
  channels jsonb DEFAULT '[]'::jsonb,
  content_pillars jsonb DEFAULT '[]'::jsonb,
  campaigns jsonb DEFAULT '[]'::jsonb,
  budget jsonb DEFAULT '{}'::jsonb,
  kpis jsonb DEFAULT '[]'::jsonb,
  roadmap_90_days jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_strategy_result TO authenticated;
GRANT ALL ON public.marketing_strategy_result TO service_role;
ALTER TABLE public.marketing_strategy_result ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ms select" ON public.marketing_strategy_result FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.business_store b WHERE b.id = business_id AND b.user_id = auth.uid()));
CREATE POLICY "ms write" ON public.marketing_strategy_result FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.business_store b WHERE b.id = business_id AND b.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.business_store b WHERE b.id = business_id AND b.user_id = auth.uid()));