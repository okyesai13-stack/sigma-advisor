-- Create chat_history table for storing advisor conversations
CREATE TABLE public.chat_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups by resume_id
CREATE INDEX idx_chat_history_resume_id ON public.chat_history(resume_id);
CREATE INDEX idx_chat_history_created_at ON public.chat_history(resume_id, created_at);

-- Enable RLS
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for public access (stateless app)
CREATE POLICY "Anyone can insert chat messages"
ON public.chat_history FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can read chat messages"
ON public.chat_history FOR SELECT
USING (true);