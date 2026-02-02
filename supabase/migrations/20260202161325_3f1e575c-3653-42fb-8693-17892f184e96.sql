-- Create table to track project building sessions
CREATE TABLE public.project_build_session (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES public.project_ideas_result(id),
  project_title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started', -- not_started, in_progress, completed
  current_phase INTEGER NOT NULL DEFAULT 1,
  total_phases INTEGER NOT NULL DEFAULT 5,
  phases JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_task_index INTEGER NOT NULL DEFAULT 0,
  completed_tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  code_snippets JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_guidance_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  skills_applied TEXT[] DEFAULT '{}',
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_build_session ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access (no auth)
CREATE POLICY "Anyone can insert project build session"
ON public.project_build_session
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can read project build session"
ON public.project_build_session
FOR SELECT
USING (true);

CREATE POLICY "Anyone can update project build session"
ON public.project_build_session
FOR UPDATE
USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_project_build_session_updated_at
BEFORE UPDATE ON public.project_build_session
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();