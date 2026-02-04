import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Loader2, Sparkles, Bot, User, X, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface TechStackItem {
  category: string;
  items: { name: string; purpose: string }[];
}

interface ProjectChatProps {
  projectTitle: string;
  techStack: TechStackItem[];
  currentStep: number;
  resumeId: string;
  projectId: string;
  setupSteps: string[];
  completedSteps: number[];
}

const ProjectChat = ({
  projectTitle,
  techStack,
  currentStep,
  resumeId,
  projectId,
  setupSteps,
  completedSteps
}: ProjectChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/project-builder`;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const techStackSummary = techStack
    .flatMap(cat => cat.items.map(item => item.name))
    .join(', ');

  const currentStepText = setupSteps[currentStep] || 'Getting started';

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: 'project_chat',
          resume_id: resumeId,
          project_id: projectId,
          project_title: projectTitle,
          tech_stack: techStackSummary,
          current_step: currentStepText,
          completed_steps: completedSteps.length,
          total_steps: setupSteps.length,
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to get response');
      }

      // Handle SSE streaming
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: 'assistant',
                    content: assistantContent,
                  };
                  return newMessages;
                });
              }
            } catch {
              // Partial JSON, continue
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "How do I start this project?",
    "Explain the tech stack",
    "Help me with the current step",
    "What are common mistakes to avoid?",
  ];

  const ChatContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold text-sm">AI Project Mentor</p>
            <p className="text-xs text-muted-foreground">Context-aware guidance</p>
          </div>
        </div>
        {!isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        )}
      </div>

      <div className="flex gap-1 mb-3 flex-wrap">
        <Badge variant="outline" className="text-xs bg-primary/5">
          Step {completedSteps.length + 1}/{setupSteps.length}
        </Badge>
        <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600">
          {Math.round((completedSteps.length / setupSteps.length) * 100) || 0}% Done
        </Badge>
      </div>

      <ScrollArea className="flex-1 pr-2" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-6">
              <Sparkles className="w-10 h-10 text-primary/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                Ask me anything about building "{projectTitle}"
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {quickPrompts.map((prompt, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      setInput(prompt);
                    }}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-3 h-3 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&_pre]:bg-background/50 [&_pre]:p-2 [&_pre]:rounded [&_code]:text-xs">
                        <ReactMarkdown>{msg.content || '...'}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-3 h-3" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">AI is thinking...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="mt-3 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this project..."
          className="text-sm"
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          disabled={isLoading}
        />
        <Button size="icon" onClick={sendMessage} disabled={isLoading || !input.trim()}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );

  // Mobile: Show as FAB with Sheet
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          >
            <MessageCircle className="w-6 h-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
          <SheetHeader className="sr-only">
            <SheetTitle>AI Project Mentor</SheetTitle>
          </SheetHeader>
          <div className="h-full pt-2">
            <ChatContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Sidebar card
  return (
    <Card className={`h-full flex flex-col transition-all duration-300 ${isExpanded ? 'fixed inset-4 z-50' : ''}`}>
      <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
        <ChatContent />
      </CardContent>
    </Card>
  );
};

export default ProjectChat;
