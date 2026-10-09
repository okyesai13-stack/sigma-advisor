CREATE TABLE public.lean_canvas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL UNIQUE REFERENCES public.business_store(id) ON DELETE CASCADE,
  boxes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lean_canvas TO authenticated;
GRANT ALL ON public.lean_canvas TO service_role;
ALTER TABLE public.lean_canvas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lc owner" ON public.lean_canvas FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.business_store b WHERE b.id = lean_canvas.business_id AND b.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.business_store b WHERE b.id = lean_canvas.business_id AND b.user_id = auth.uid()));
CREATE TRIGGER lean_canvas_updated BEFORE UPDATE ON public.lean_canvas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();