import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Send,
  Sparkles,
  User,
  Plus,
  Settings,
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

// Clean any remaining markdown/formatting from message
const formatMessage = (content: string): string => {
  return content
    .replace(/#{1,6}\s*/g, '')           // Remove # headers
    .replace(/\*\*([^*]+)\*\*/g, '$1')   // Remove **bold**
    .replace(/\*([^*]+)\*/g, '$1')       // Remove *italic*
    .replace(/^[-]\s+/gm, '• ')          // Replace - bullets with •
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Remove links
    .replace(/`([^`]+)`/g, '$1')         // Remove inline code
    .replace(/```[\s\S]*?```/g, '')      // Remove code blocks
    .replace(/^\s*>\s*/gm, '')           // Remove blockquotes
    .replace(/\[\s*\]/g, '')             // Remove empty []
    .replace(/\[\s*x\s*\]/gi, '✓')       // Replace [x] with ✓
    .replace(/\n{3,}/g, '\n\n')          // Limit consecutive newlines
    .trim();
};

const Advisor = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { loading: guardLoading } = usePageGuard('profile_completed', '/setup');

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation history
  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('advisor_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      if (data && data.length > 0) {
        setMessages(data.map(c => ({
          role: c.role as 'user' | 'assistant',
          content: c.message
        })));
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user || isLoading) return;

    const userMessage: Message = { role: "user", content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const { data, error } = await supabase.functions.invoke("chat-with-advisor", {
        body: { message: inputValue },
      });

      if (error) throw error;

      if (data?.response) {
        const aiResponse: Message = {
          role: "assistant",
          content: data.response,
        };
        setMessages((prev) => [...prev, aiResponse]);
      }
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
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  const startNewChat = async () => {
    if (!user) return;
    
    try {
      // Clear conversations from database
      await supabase
        .from('advisor_conversations')
        .delete()
        .eq('user_id', user.id);
      
      setMessages([]);
      toast({
        title: "New chat started",
        description: "Your conversation has been cleared.",
      });
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  if (guardLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg text-foreground">Career Advisor</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={startNewChat}
            className="rounded-full"
            title="New chat"
          >
            <Plus className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {messages.length === 0 ? (
          /* Empty State */
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
            <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
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
          </div>
        ) : (
          /* Messages */
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
                          : "bg-muted/50 text-foreground rounded-tl-sm"
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
                  <div className="flex items-center gap-1 px-4 py-3 rounded-2xl rounded-tl-sm bg-muted/50">
                    <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}

        {/* Input Area */}
        <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2 bg-muted/50 rounded-2xl border border-border focus-within:border-primary/50 transition-colors">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about your career..."
                className="flex-1 min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-3 px-4 text-sm"
                rows={1}
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
                className="shrink-0 rounded-full w-9 h-9 mr-1.5 mb-1.5"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Career Advisor can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Advisor;
