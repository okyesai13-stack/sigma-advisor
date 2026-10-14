CREATE TABLE public.idea_stress_test (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.business_store(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  verdict text,
  reason text,
  risks jsonb NOT NULL DEFAULT '[]'::jsonb,
  killers jsonb NOT NULL DEFAULT '[]'::jsonb,
  blind_spots jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.idea_stress_test TO authenticated;
GRANT ALL ON public.idea_stress_test TO service_role;
ALTER TABLE public.idea_stress_test ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ist owner" ON public.idea_stress_test FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.business_store b WHERE b.id = idea_stress_test.business_id AND b.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.business_store b WHERE b.id = idea_stress_test.business_id AND b.user_id = auth.uid()));