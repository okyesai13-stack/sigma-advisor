import { useState } from "react";
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
  AlertCircle,
  Star,
  User,
  Bot,
} from "lucide-react";

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
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "interviewer",
      content: "Hello! Welcome to your mock interview for the Full-Stack Developer position. I'm going to ask you a series of questions to assess your technical skills and problem-solving abilities. Let's start with an introduction. Can you tell me about yourself and your journey into software development?",
    },
  ]);

  const questions = [
    "Can you tell me about yourself and your journey into software development?",
    "What's a challenging technical problem you've solved recently? Walk me through your approach.",
    "How would you explain the difference between REST and GraphQL to a non-technical person?",
    "Describe a project you're proud of. What was your role and what did you learn?",
    "Where do you see yourself in 5 years as a developer?",
  ];

  const [feedback] = useState<Feedback[]>([
    { category: "Communication", score: 85, comment: "Clear and structured responses. Good use of examples." },
    { category: "Technical Knowledge", score: 78, comment: "Solid fundamentals. Could go deeper on advanced topics." },
    { category: "Problem Solving", score: 82, comment: "Good analytical approach. Consider edge cases more." },
    { category: "Enthusiasm", score: 90, comment: "Great passion for development. Positive attitude." },
    { category: "Fit", score: 88, comment: "Strong alignment with team culture and values." },
  ]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = { role: "user", content: inputValue };
    setMessages([...messages, userMessage]);
    setInputValue("");

    // Simulate interviewer response
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        const nextQuestion = currentQuestion + 1;
        setCurrentQuestion(nextQuestion);
        const interviewerMessage: Message = {
          role: "interviewer",
          content: `Great answer! Let me ask you the next question: ${questions[nextQuestion]}`,
        };
        setMessages((prev) => [...prev, interviewerMessage]);
      } else {
        const endMessage: Message = {
          role: "interviewer",
          content: "Thank you for completing the interview! I've prepared detailed feedback on your performance. Click 'View Feedback' to see your results.",
        };
        setMessages((prev) => [...prev, endMessage]);
        setInterviewComplete(true);
      }
    }, 1500);
  };

  const overallScore = Math.round(
    feedback.reduce((acc, f) => acc + f.score, 0) / feedback.length
  );

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
                Question {currentQuestion + 1} of {questions.length}
              </span>
            </div>
            <Progress value={((currentQuestion + 1) / questions.length) * 100} className="h-2" />
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
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="flex gap-3">
            <Input
              placeholder="Type your response..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 h-12"
            />
            <Button variant="hero" size="lg" onClick={handleSendMessage}>
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

            {/* Actions */}
            <div className="p-8 border-t border-border flex gap-4 justify-center">
              <Button variant="outline" onClick={() => {
                setMessages([{
                  role: "interviewer",
                  content: "Hello! Welcome to your mock interview for the Full-Stack Developer position. I'm going to ask you a series of questions to assess your technical skills and problem-solving abilities. Let's start with an introduction. Can you tell me about yourself and your journey into software development?",
                }]);
                setCurrentQuestion(0);
                setInterviewComplete(false);
              }}>
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
