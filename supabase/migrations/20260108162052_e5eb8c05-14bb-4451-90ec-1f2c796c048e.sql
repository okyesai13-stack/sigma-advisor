-- Add RLS policies for resume_analysis table
ALTER TABLE public.resume_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own resume analysis"
ON public.resume_analysis
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resume analysis"
ON public.resume_analysis
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resume analysis"
ON public.resume_analysis
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resume analysis"
ON public.resume_analysis
FOR DELETE
USING (auth.uid() = user_id);