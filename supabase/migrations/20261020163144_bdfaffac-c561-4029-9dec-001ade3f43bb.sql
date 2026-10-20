CREATE TABLE public.startup_roadmap (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL UNIQUE REFERENCES public.business_store(id) ON DELETE CASCADE,
  goal text,
  phases jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.startup_roadmap TO authenticated;
GRANT ALL ON public.startup_roadmap TO service_role;
ALTER TABLE public.startup_roadmap ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sr owner" ON public.startup_roadmap FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.business_store b WHERE b.id = startup_roadmap.business_id AND b.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.business_store b WHERE b.id = startup_roadmap.business_id AND b.user_id = auth.uid()));
CREATE TRIGGER sr_updated BEFORE UPDATE ON public.startup_roadmap FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.credit_cost(p_action text) RETURNS integer LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE p_action
    WHEN 'convene' THEN 10 WHEN 'agent_rerun' THEN 2 WHEN 'stress_test' THEN 5
    WHEN 'canvas_ai' THEN 1 WHEN 'advisor_chat' THEN 1 WHEN 'roadmap' THEN 3 ELSE NULL END
$$;