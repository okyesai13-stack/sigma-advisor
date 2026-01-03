-- Create table for project analysis steps
CREATE TABLE public.user_project_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_project_id uuid NOT NULL REFERENCES public.user_projects(id) ON DELETE CASCADE,
  plan_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  build_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_tools jsonb NOT NULL DEFAULT '[]'::jsonb,
  plan_completed boolean[] DEFAULT '{}',
  build_completed boolean[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_project_steps ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own project steps"
ON public.user_project_steps FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project steps"
ON public.user_project_steps FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project steps"
ON public.user_project_steps FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_project_steps_updated_at
BEFORE UPDATE ON public.user_project_steps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();