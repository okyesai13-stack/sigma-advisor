-- Create a table for chat sessions
CREATE TABLE public.advisor_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New Chat',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.advisor_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own chat sessions"
ON public.advisor_chat_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat sessions"
ON public.advisor_chat_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
ON public.advisor_chat_sessions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions"
ON public.advisor_chat_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- Add session_id to advisor_conversations
ALTER TABLE public.advisor_conversations
ADD COLUMN session_id uuid REFERENCES public.advisor_chat_sessions(id) ON DELETE CASCADE;

-- Create trigger for updated_at
CREATE TRIGGER update_advisor_chat_sessions_updated_at
BEFORE UPDATE ON public.advisor_chat_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();