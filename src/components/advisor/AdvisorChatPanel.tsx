import { useState, useEffect, useRef } from "react";
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

const AdvisorChatPanel = () => {
  const { toast } = useToast();
  const { resumeId } = useResume();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!resumeId) {
      setIsLoadingHistory(false);
      return;
    }

    const loadChatHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_history')
          .select('role, content')
          .eq('resume_id', resumeId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setMessages(data.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          })));
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, [resumeId]);

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
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/advisor-chat-stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            message: messageToSend, 
            resume_id: resumeId
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let textBuffer = '';

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const updated = [...prev];
                const lastIndex = updated.length - 1;
                if (updated[lastIndex]?.role === 'assistant') {
                  updated[lastIndex] = { ...updated[lastIndex], content: formatMessage(assistantContent) };
                }
                return updated;
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Failed to get response:", error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive"
      });
      setMessages((prev) => prev.filter((_, i) => i !== prev.length - 1 || prev[prev.length - 1].content !== ''));
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
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  const handleSuggestionClick = (description: string) => {
    setInputValue(description);
    textareaRef.current?.focus();
  };

  if (isLoadingHistory) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Panel Header */}
      <div className="border-b border-border px-4 py-3 flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">AI Career Advisor</h2>
          <p className="text-[10px] text-muted-foreground">Powered by Gemini</p>
        </div>
      </div>

      {messages.length === 0 ? (
        /* Empty State */
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">
                How can I help?
              </h3>
              <p className="text-muted-foreground text-sm max-w-[240px]">
                Ask me anything about your career journey.
              </p>
            </div>

            {resumeId && (
              <div className="grid grid-cols-2 gap-2 w-full max-w-sm mb-4">
                {suggestionCards.map((card, index) => (
                  <button
                    key={card.title}
                    onClick={() => handleSuggestionClick(card.description)}
                    className={cn(
                      "group relative p-3 rounded-xl border border-border bg-card hover:bg-accent/50 text-left transition-all duration-200 hover:shadow-md",
                    )}
                  >
                    <div className={cn(
                      "absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity",
                      card.gradient
                    )} />
                    <div className="relative">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center mb-2">
                        <card.icon className={cn("w-4 h-4", card.iconColor)} />
                      </div>
                      <p className="font-medium text-foreground text-xs">{card.title}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">{card.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!resumeId && (
              <p className="text-xs text-muted-foreground text-center px-4">
                Upload your resume first to start chatting with the advisor.
              </p>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border shrink-0">
            <div className="relative bg-card border border-border rounded-2xl">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={resumeId ? "Ask me anything..." : "Upload resume first..."}
                className="w-full min-h-[44px] max-h-[160px] resize-none border-0 rounded-2xl focus-visible:ring-0 focus-visible:ring-offset-0 py-3 pl-4 pr-12 text-sm bg-transparent"
                rows={1}
                disabled={isLoading || !resumeId}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading || !resumeId}
                size="icon"
                className="absolute right-1.5 bottom-1.5 rounded-full w-8 h-8 bg-primary hover:bg-primary/90 disabled:opacity-30"
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
        /* Messages View */
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1">
            <div className="py-4 px-3 space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "animate-fade-in",
                    message.role === "user" ? "flex justify-end" : ""
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="flex gap-3">
                      <Avatar className="w-6 h-6 shrink-0 mt-1">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-[10px]">
                          <Sparkles className="w-3 h-3" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-muted-foreground mb-1">Advisor</p>
                        <p className="text-sm leading-6 whitespace-pre-wrap text-foreground">
                          {formatMessage(message.content)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-[85%]">
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.content === '' && (
                <div className="flex gap-3 animate-fade-in">
                  <Avatar className="w-6 h-6 shrink-0 mt-1">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-[10px]">
                      <Sparkles className="w-3 h-3" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-1 py-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-border shrink-0">
            <div className="relative bg-card border border-border rounded-2xl">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask a follow up..."
                className="w-full min-h-[44px] max-h-[160px] resize-none border-0 rounded-2xl focus-visible:ring-0 focus-visible:ring-offset-0 py-3 pl-4 pr-12 text-sm bg-transparent"
                rows={1}
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
                className="absolute right-1.5 bottom-1.5 rounded-full w-8 h-8 bg-primary hover:bg-primary/90 disabled:opacity-30"
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
      )}
    </div>
  );
};

export default AdvisorChatPanel;
