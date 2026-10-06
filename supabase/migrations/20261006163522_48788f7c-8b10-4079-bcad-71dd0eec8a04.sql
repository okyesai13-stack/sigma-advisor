CREATE TABLE public.ai_operations_result (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_store(id) ON DELETE CASCADE,
  summary text,
  readiness jsonb DEFAULT '{}'::jsonb,
  quick_wins jsonb DEFAULT '[]'::jsonb,
  systemic_automations jsonb DEFAULT '[]'::jsonb,
  tool_stack jsonb DEFAULT '[]'::jsonb,
  defensibility jsonb DEFAULT '{}'::jsonb,
  roi jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_operations_result TO authenticated;
GRANT ALL ON public.ai_operations_result TO service_role;
ALTER TABLE public.ai_operations_result ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aio select" ON public.ai_operations_result FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.business_store b WHERE b.id = ai_operations_result.business_id AND b.user_id = auth.uid()));
CREATE POLICY "aio write" ON public.ai_operations_result FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.business_store b WHERE b.id = ai_operations_result.business_id AND b.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.business_store b WHERE b.id = ai_operations_result.business_id AND b.user_id = auth.uid()));