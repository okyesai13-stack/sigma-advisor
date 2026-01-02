import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  Send,
  CheckCircle2,
  Star,
  User,
  Bot,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePageGuard, useJourneyState } from "@/hooks/useJourneyState";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "interviewer" | "user";
  content: string;
}

interface Feedback {
  category: string;
  score: number;
  comment: string;
}

const Interview = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { loading: guardLoading } = usePageGuard('job_ready', '/job-readiness');
  const { updateState } = useJourneyState();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [overallScore, setOverallScore] = useState(0);

  useEffect(() => {
    if (user) {
      startInterview();
    }
  }, [user]);

  const startInterview = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('run-ai-interview', {
        body: {}
      });

      if (error) throw error;

      if (data?.question) {
        setMessages([{
          role: "interviewer",
          content: data.question
        }]);
      } else {
        setMessages([{
          role: "interviewer",
          content: "Hello! Welcome to your mock interview. I'm going to ask you a series of questions to assess your skills. Let's start with an introduction. Can you tell me about yourself and your journey?"
        }]);
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      setMessages([{
        role: "interviewer",
        content: "Hello! Welcome to your mock interview. I'm going to ask you a series of questions to assess your skills. Can you tell me about yourself?"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user || isLoading) return;

    const userMessage: Message = { role: "user", content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('run-ai-interview', {
        body: { message: inputValue }
      });

      if (error) throw error;

      if (data?.feedback) {
        // Interview is complete
        const feedbackItems: Feedback[] = data.feedback.categories?.map((cat: any) => ({
          category: cat.name,
          score: cat.score,
          comment: cat.comment
        })) || [];

        setFeedback(feedbackItems);
        setOverallScore(data.feedback.overall_score || 0);

        setMessages((prev) => [...prev, {
          role: "interviewer",
          content: "Thank you for completing the interview! I've prepared detailed feedback on your performance. Click 'View Feedback' to see your results."
        }]);

        setInterviewComplete(true);
        await updateState({ interview_completed: true });

        toast({
          title: "Interview Complete",
          description: "Great job! Your results are ready.",
        });
      } else if (data?.question) {
        // More questions
        setCurrentQuestion((prev) => prev + 1);
        setMessages((prev) => [...prev, {
          role: "interviewer",
          content: data.question
        }]);
      }
    } catch (error) {
      console.error('Error during interview:', error);
      setMessages((prev) => [...prev, {
        role: "interviewer",
        content: "I'm having trouble processing that. Could you try answering again?"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetInterview = async () => {
    setMessages([]);
    setCurrentQuestion(0);
    setInterviewComplete(false);
    setFeedback([]);
    setOverallScore(0);
    await startInterview();
  };

  if (guardLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/job-readiness")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Job Readiness
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">AI Interview</span>
          </div>
        </div>
      </div>

      {!interviewComplete ? (
        /* Interview Chat View */
        <div className="flex-1 flex flex-col container mx-auto max-w-3xl px-6 py-8">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Interview Progress</span>
              <span className="text-foreground font-medium">
                Question {currentQuestion + 1}
              </span>
            </div>
            <Progress value={Math.min((currentQuestion + 1) * 20, 100)} className="h-2" />
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 mb-6">
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      message.role === "interviewer" ? "bg-gradient-hero" : "bg-secondary"
                    }`}
                  >
                    {message.role === "interviewer" ? (
                      <Bot className="w-5 h-5 text-primary-foreground" />
                    ) : (
                      <User className="w-5 h-5 text-secondary-foreground" />
                    )}
                  </div>
                  <div
                    className={`flex-1 p-4 rounded-2xl ${
                      message.role === "user"
                        ? "bg-gradient-hero text-primary-foreground"
                        : "bg-card border border-border text-foreground"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-hero">
                    <Bot className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 p-4 rounded-2xl bg-card border border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="flex gap-3">
            <Input
              placeholder="Type your response..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSendMessage()}
              className="flex-1 h-12"
              disabled={isLoading}
            />
            <Button variant="hero" size="lg" onClick={handleSendMessage} disabled={isLoading}>
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      ) : (
        /* Feedback View */
        <div className="container mx-auto max-w-4xl px-6 py-8">
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg animate-scale-in">
            {/* Header */}
            <div className="p-8 border-b border-border text-center bg-gradient-subtle">
              <div className="w-20 h-20 rounded-2xl bg-gradient-hero flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Interview Complete!</h1>
              <p className="text-muted-foreground">Here's your detailed feedback</p>
            </div>

            {/* Overall Score */}
            <div className="p-8 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Overall Performance</h2>
                  <p className="text-muted-foreground mt-1">
                    Based on your responses across all questions
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                    {overallScore}%
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(overallScore / 20)
                            ? "text-warning fill-warning"
                            : "text-muted"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Feedback */}
            {feedback.length > 0 && (
              <div className="p-8">
                <h3 className="font-semibold text-foreground mb-6">Detailed Feedback</h3>
                <div className="space-y-6">
                  {feedback.map((item) => (
                    <div key={item.category} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{item.category}</span>
                        <Badge
                          variant="secondary"
                          className={
                            item.score >= 85
                              ? "bg-success/10 text-success"
                              : item.score >= 70
                              ? "bg-warning/10 text-warning"
                              : "bg-destructive/10 text-destructive"
                          }
                        >
                          {item.score}%
                        </Badge>
                      </div>
                      <Progress value={item.score} className="h-2" />
                      <p className="text-sm text-muted-foreground">{item.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="p-8 border-t border-border flex gap-4 justify-center">
              <Button variant="outline" onClick={resetInterview}>
                Try Again
              </Button>
              <Button
                variant="hero"
                size="lg"
                onClick={() => navigate("/apply")}
                className="gap-2"
              >
                Continue to Apply
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Interview;
