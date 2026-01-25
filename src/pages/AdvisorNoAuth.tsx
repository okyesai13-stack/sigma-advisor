import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Send,
  Sparkles,
  User,
  Loader2,
  Lightbulb,
  GraduationCap,
  FileText,
  Target,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useResume } from "@/contexts/ResumeContext";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

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

const suggestionCards = [
  {
    icon: Target,
    title: "Career path",
    description: "What career suits my skills?",
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-500",
  },
  {
    icon: GraduationCap,
    title: "Interview prep",
    description: "How do I prepare for interviews?",
    gradient: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-500",
  },
  {
    icon: Lightbulb,
    title: "Skill development",
    description: "What skills should I learn next?",
    gradient: "from-orange-500/20 to-amber-500/20",
    iconColor: "text-orange-500",
  },
  {
    icon: FileText,
    title: "Resume review",
    description: "Help me improve my resume",
    gradient: "from-emerald-500/20 to-green-500/20",
    iconColor: "text-emerald-500",
  },
];

const AdvisorNoAuth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { resumeId } = useResume();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!resumeId) {
      navigate('/setup');
    }
  }, [resumeId, navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !resumeId) return;

    const userMessage: Message = { role: "user", content: inputValue };
    const messageToSend = inputValue;
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const { data, error } = await supabase.functions.invoke("advisor-chat", {
        body: { 
          message: messageToSend, 
          resume_id: resumeId,
          conversation_history: messages.slice(-10) // Send last 10 messages for context
        },
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
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  const handleSuggestionClick = (description: string) => {
    setInputValue(description);
    textareaRef.current?.focus();
  };

  if (!resumeId) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">AI Career Advisor</h1>
              <p className="text-xs text-muted-foreground">Powered by Gemini</p>
            </div>
          </div>
        </div>
      </header>

      {messages.length === 0 ? (
        /* Empty State */
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center px-4 pb-32">
            <div className="text-center mb-12 animate-fade-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-6">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-medium text-foreground mb-3">
                Hello, how can I help?
              </h1>
              <p className="text-muted-foreground text-lg max-w-md">
                I'm your AI career advisor. Ask me anything about your professional journey.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl w-full mb-8">
              {suggestionCards.map((card, index) => (
                <button
                  key={card.title}
                  onClick={() => handleSuggestionClick(card.description)}
                  className={cn(
                    "group relative p-4 rounded-2xl border border-border bg-card hover:bg-accent/50 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in",
                  )}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={cn(
                    "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity",
                    card.gradient
                  )} />
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <card.icon className={cn("w-5 h-5", card.iconColor)} />
                    </div>
                    <p className="font-medium text-foreground text-sm mb-1">{card.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{card.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-8 pb-6 px-4">
            <div className="max-w-3xl mx-auto">
              <div className="relative bg-card border border-border rounded-3xl shadow-lg hover:shadow-xl transition-shadow">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  className="w-full min-h-[56px] max-h-[200px] resize-none border-0 rounded-3xl focus-visible:ring-0 focus-visible:ring-offset-0 py-4 pl-5 pr-14 text-base bg-transparent"
                  rows={1}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                  className="absolute right-2 bottom-2 rounded-full w-10 h-10 bg-primary hover:bg-primary/90 disabled:opacity-30"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">
                AI Career Advisor may make mistakes. Verify important information.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Messages View */
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1">
            <div className="max-w-3xl mx-auto py-8 px-4 pb-32">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "mb-8 animate-fade-in",
                    message.role === "user" ? "flex justify-end" : ""
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="flex gap-4">
                      <Avatar className="w-8 h-8 shrink-0 mt-1">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                          <Sparkles className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Career Advisor</p>
                        <div className="prose prose-sm max-w-none text-foreground">
                          <p className="text-[15px] leading-7 whitespace-pre-wrap">
                            {formatMessage(message.content)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 items-end max-w-[85%]">
                      <div className="bg-primary text-primary-foreground rounded-3xl rounded-br-lg px-5 py-3">
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                      <Avatar className="w-7 h-7 shrink-0">
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                          <User className="w-3.5 h-3.5" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-4 animate-fade-in">
                  <Avatar className="w-8 h-8 shrink-0 mt-1">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                      <Sparkles className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Career Advisor</p>
                    <div className="flex items-center gap-1 py-3">
                      <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-8 pb-6 px-4">
            <div className="max-w-3xl mx-auto">
              <div className="relative bg-card border border-border rounded-3xl shadow-lg hover:shadow-xl transition-shadow">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a follow up..."
                  className="w-full min-h-[56px] max-h-[200px] resize-none border-0 rounded-3xl focus-visible:ring-0 focus-visible:ring-offset-0 py-4 pl-5 pr-14 text-base bg-transparent"
                  rows={1}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                  className="absolute right-2 bottom-2 rounded-full w-10 h-10 bg-primary hover:bg-primary/90 disabled:opacity-30"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvisorNoAuth;
