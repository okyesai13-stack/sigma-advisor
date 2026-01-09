import { useState, useEffect, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Send,
  Sparkles,
  User,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePageGuard } from "@/hooks/useJourneyState";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

// Clean any remaining markdown/formatting from message
const formatMessage = (content: string): string => {
  return content
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^[-]\s+/gm, '• ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^\s*>\s*/gm, '')
    .replace(/\[\s*\]/g, '')
    .replace(/\[\s*x\s*\]/gi, '✓')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const Advisor = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { loading: guardLoading } = usePageGuard('profile_completed', '/setup');

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle prefill message from Dashboard
  useEffect(() => {
    const state = location.state as { prefillMessage?: string } | null;
    if (state?.prefillMessage) {
      setInputValue(state.prefillMessage);
      textareaRef.current?.focus();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Handle session parameter from URL
  useEffect(() => {
    const sessionId = searchParams.get('session');
    if (sessionId && sessionId !== currentSessionId) {
      setCurrentSessionId(sessionId);
      loadConversations(sessionId);
    } else if (!sessionId && currentSessionId) {
      // Clear session if no session parameter
      setCurrentSessionId(null);
      setMessages([]);
    }
  }, [searchParams, currentSessionId]);

  const loadConversations = async (sessionId: string) => {
    if (!user) return;
    setLoadingSession(true);

    try {
      const { data, error } = await supabase
        .from('advisor_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        setMessages(data.map(c => ({
          role: c.role === 'advisor' ? 'assistant' : 'user' as 'user' | 'assistant',
          content: c.message
        })));
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingSession(false);
    }
  };

  const createNewSession = async (): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('advisor_chat_sessions')
        .insert({
          user_id: user.id,
          title: 'New Chat',
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  };

  const updateSessionTitle = async (sessionId: string, firstMessage: string) => {
    // Generate a title from the first message (first 50 chars or first sentence)
    let title = firstMessage.slice(0, 50);
    const sentenceEnd = firstMessage.search(/[.?!]/);
    if (sentenceEnd > 0 && sentenceEnd < 50) {
      title = firstMessage.slice(0, sentenceEnd + 1);
    }
    if (title.length < firstMessage.length) {
      title += '...';
    }

    try {
      await supabase
        .from('advisor_chat_sessions')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Error updating session title:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user || isLoading) return;

    const userMessage: Message = { role: "user", content: inputValue };
    const messageToSend = inputValue;
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      let sessionId = currentSessionId;
      
      // Create new session if none exists
      if (!sessionId) {
        sessionId = await createNewSession();
        if (!sessionId) throw new Error("Failed to create session");
        setCurrentSessionId(sessionId);
        // Update URL to include session parameter
        setSearchParams({ session: sessionId });
      }

      // Update title if this is the first message
      if (messages.length === 0) {
        updateSessionTitle(sessionId, messageToSend);
      }

      const { data, error } = await supabase.functions.invoke("chat-with-advisor", {
        body: { message: messageToSend, sessionId },
      });

      if (error) throw error;

      if (data?.response) {
        const aiResponse: Message = {
          role: "assistant",
          content: data.response,
        };
        setMessages((prev) => [...prev, aiResponse]);
      }

      // Update session updated_at
      await supabase
        .from('advisor_chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);

    } catch (error) {
      console.error("Failed to get response:", error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  const startNewChat = async () => {
    setMessages([]);
    setCurrentSessionId(null);
    // Remove session parameter from URL
    setSearchParams({});
    toast({
      title: "New chat started",
      description: "Start typing to begin a new conversation.",
    });
  };

  if (guardLoading || loadingSession) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Chat Area - Full Height */}
      <div className="flex-1 flex flex-col min-h-0">
        {messages.length === 0 ? (
          /* Empty State - Centered */
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2 text-center">
              How can I help with your career today?
            </h1>
            <p className="text-muted-foreground text-center max-w-md mb-8">
              Ask me anything about career paths, skill development, interview preparation, or job search strategies.
            </p>
            
            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 justify-center max-w-2xl mb-8">
              {[
                "What career path suits my skills?",
                "How do I prepare for interviews?",
                "What skills should I learn?",
                "Help me with my resume",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInputValue(suggestion);
                    textareaRef.current?.focus();
                  }}
                  className="px-4 py-2 rounded-full border border-border bg-card hover:bg-accent hover:border-primary/50 text-sm text-foreground transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Centered Input Area */}
            <div className="w-full max-w-2xl">
              <div className="relative flex items-end gap-2">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about your career..."
                  className="flex-1 min-h-[44px] max-h-[200px] resize-none border border-border rounded-2xl focus-visible:ring-1 focus-visible:ring-primary py-3 px-4 text-sm"
                  rows={1}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                  className="shrink-0 rounded-full w-9 h-9"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Messages with Input at Bottom */
          <>
            <ScrollArea className="flex-1">
              <div className="max-w-3xl mx-auto py-6 px-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-4 mb-6",
                      message.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    {/* Avatar */}
                    <Avatar className={cn(
                      "w-8 h-8 shrink-0",
                      message.role === "assistant" && "bg-gradient-to-br from-primary to-primary/60"
                    )}>
                      <AvatarFallback className={cn(
                        message.role === "assistant" 
                          ? "bg-transparent text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        {message.role === "assistant" ? (
                          <Sparkles className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>

                    {/* Message Content */}
                    <div className={cn(
                      "flex-1 max-w-[85%]",
                      message.role === "user" && "flex justify-end"
                    )}>
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-3",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "text-foreground rounded-tl-sm"
                        )}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {formatMessage(message.content)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex gap-4 mb-6">
                    <Avatar className="w-8 h-8 shrink-0 bg-gradient-to-br from-primary to-primary/60">
                      <AvatarFallback className="bg-transparent text-primary-foreground">
                        <Sparkles className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1 px-4 py-3 rounded-2xl rounded-tl-sm">
                      <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area - Fixed at Bottom */}
            <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
              <div className="max-w-3xl mx-auto">
                <div className="relative flex items-end gap-2">
                  <Textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything about your career..."
                    className="flex-1 min-h-[44px] max-h-[200px] resize-none border border-border rounded-2xl focus-visible:ring-1 focus-visible:ring-primary py-3 px-4 text-sm"
                    rows={1}
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    size="icon"
                    className="shrink-0 rounded-full w-9 h-9"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
  };

export default Advisor;
