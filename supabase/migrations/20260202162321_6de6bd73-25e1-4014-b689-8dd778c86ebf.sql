-- Create table to store AI-generated learning content per skill
CREATE TABLE public.learning_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id TEXT NOT NULL,
  skill_id UUID NOT NULL REFERENCES public.learning_plan_result(id),
  skill_name TEXT NOT NULL,
  mind_map_data JSONB DEFAULT NULL,
  flowchart_data JSONB DEFAULT NULL,
  quiz_data JSONB DEFAULT NULL,
  mind_map_completed BOOLEAN NOT NULL DEFAULT false,
  flowchart_completed BOOLEAN NOT NULL DEFAULT false,
  quiz_completed BOOLEAN NOT NULL DEFAULT false,
  quiz_score INTEGER DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(resume_id, skill_id)
);

-- Enable Row Level Security
ALTER TABLE public.learning_content ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Anyone can read learning content"
ON public.learning_content
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert learning content"
ON public.learning_content
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update learning content"
ON public.learning_content
FOR UPDATE
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_learning_content_updated_at
BEFORE UPDATE ON public.learning_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_learning_content_resume_skill ON public.learning_content(resume_id, skill_id);