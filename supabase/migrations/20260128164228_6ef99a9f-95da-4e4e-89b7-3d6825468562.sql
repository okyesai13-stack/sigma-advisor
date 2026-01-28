-- Create table for storing upgraded resume results
CREATE TABLE public.upgraded_resume_result (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id TEXT NOT NULL,
  resume_data JSONB NOT NULL DEFAULT '{}',
  target_role TEXT,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.upgraded_resume_result ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth)
CREATE POLICY "Anyone can insert upgraded resume" 
ON public.upgraded_resume_result 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can read upgraded resume" 
ON public.upgraded_resume_result 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update upgraded resume" 
ON public.upgraded_resume_result 
FOR UPDATE 
USING (true);

-- Add index for efficient lookup by resume_id
CREATE INDEX idx_upgraded_resume_result_resume_id ON public.upgraded_resume_result(resume_id);