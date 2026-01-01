import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import {
  Target,
  Send,
  Sparkles,
  CheckCircle2,
  Circle,
  BookOpen,
  Briefcase,
  Code,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  Zap,
  Award,
  FileText,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CareerOption {
  title: string;
  match: number;
  description: string;
  skills: string[];
}

const Advisor = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Welcome! Based on your profile, I've analyzed your goals, interests, and background. I'm ready to recommend career paths that align perfectly with your aspirations. Let's find your ideal career direction.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [selectedCareer, setSelectedCareer] = useState<string | null>(null);

  const steps = [
    { id: 1, label: "Career Recommendation", icon: Target },
    { id: 2, label: "Career Path", icon: TrendingUp },
    { id: 3, label: "Skill Validation", icon: Zap },
    { id: 4, label: "Learning", icon: BookOpen },
    { id: 5, label: "Projects", icon: Code },
    { id: 6, label: "Job Readiness", icon: FileText },
    { id: 7, label: "Interview", icon: MessageSquare },
    { id: 8, label: "Apply", icon: Briefcase },
  ];

  const careerOptions: CareerOption[] = [
    {
      title: "Full-Stack Developer",
      match: 95,
      description: "Build complete web applications from frontend to backend",
      skills: ["React", "Node.js", "TypeScript", "PostgreSQL"],
    },
    {
      title: "Product Manager",
      match: 88,
      description: "Lead product strategy and cross-functional teams",
      skills: ["Strategy", "Analytics", "Communication", "Agile"],
    },
    {
      title: "UX Designer",
      match: 82,
      description: "Create intuitive and beautiful user experiences",
      skills: ["Figma", "User Research", "Prototyping", "Design Systems"],
    },
  ];

  const skills = [
    { name: "JavaScript", required: 4, current: 3, status: "gap" },
    { name: "React", required: 4, current: 2, status: "gap" },
    { name: "TypeScript", required: 3, current: 1, status: "gap" },
    { name: "Node.js", required: 3, current: 2, status: "gap" },
    { name: "Git", required: 3, current: 3, status: "ready" },
    { name: "HTML/CSS", required: 3, current: 4, status: "ready" },
  ];

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = { role: "user", content: inputValue };
    setMessages([...messages, userMessage]);
    setInputValue("");

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        role: "assistant",
        content: "I understand your question. Based on your profile and the career options I've analyzed, I recommend focusing on Full-Stack Development as it aligns well with your technical interests and goal of finding a job. Would you like to proceed with this career path?",
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  const selectCareer = (title: string) => {
    setSelectedCareer(title);
    setCurrentStep(2);
    setMessages([
      ...messages,
      {
        role: "assistant",
        content: `Excellent choice! You've selected ${title} as your career path. This is a great match based on your profile. Let me now validate your current skills and identify any gaps we need to address.`,
      },
    ]);
  };

  const proceedToSkills = () => {
    setCurrentStep(3);
    setMessages([
      ...messages,
      {
        role: "assistant",
        content: "I've analyzed your skills against industry requirements. You have some gaps to close, but don't worry – I'll create a personalized learning path for you. Review your skill assessment on the right panel.",
      },
    ]);
  };

  const proceedToLearn = () => {
    navigate("/learn");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Status */}
      <div className="w-80 border-r border-border bg-card p-6 hidden lg:flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">AI Career Advisor</span>
        </div>

        {/* User Goal Summary */}
        <div className="mb-8">
          <div className="text-sm text-muted-foreground mb-2">Your Goal</div>
          <div className="p-4 rounded-xl bg-accent/50 border border-border">
            <div className="flex items-center gap-2 text-foreground font-medium mb-1">
              <Target className="w-4 h-4 text-primary" />
              Find a Job
            </div>
            <p className="text-sm text-muted-foreground">
              Become a professional developer at a tech company
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="text-foreground font-medium">{Math.round((currentStep / steps.length) * 100)}%</span>
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
        </div>

        {/* Steps */}
        <div className="flex-1">
          <div className="text-sm text-muted-foreground mb-4">Journey Steps</div>
          <div className="space-y-2">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  step.id === currentStep
                    ? "bg-accent text-accent-foreground"
                    : step.id < currentStep
                    ? "text-success"
                    : "text-muted-foreground"
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  step.id < currentStep
                    ? "bg-success"
                    : step.id === currentStep
                    ? "bg-gradient-hero"
                    : "bg-muted"
                }`}>
                  {step.id < currentStep ? (
                    <CheckCircle2 className="w-4 h-4 text-success-foreground" />
                  ) : step.id === currentStep ? (
                    <step.icon className="w-3 h-3 text-primary-foreground" />
                  ) : (
                    <Circle className="w-3 h-3" />
                  )}
                </div>
                <span className={`text-sm ${step.id === currentStep ? "font-medium" : ""}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Center Panel - Chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-foreground font-medium">AI Advisor Active</span>
          </div>
          <Badge variant="secondary" className="bg-accent text-accent-foreground">
            Step {currentStep}: {steps[currentStep - 1].label}
          </Badge>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    message.role === "user"
                      ? "bg-gradient-hero text-primary-foreground"
                      : "bg-card border border-border text-foreground"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-primary">AI Advisor</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}

            {/* Career Options (Step 1) */}
            {currentStep === 1 && !selectedCareer && (
              <div className="space-y-4">
                <div className="text-center text-muted-foreground text-sm">
                  Select a career path that interests you
                </div>
                <div className="grid gap-4">
                  {careerOptions.map((career) => (
                    <button
                      key={career.title}
                      onClick={() => selectCareer(career.title)}
                      className="p-5 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all text-left group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {career.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {career.description}
                          </p>
                        </div>
                        <Badge className="bg-success/10 text-success border-success/20">
                          {career.match}% Match
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {career.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-6 border-t border-border bg-card">
          <div className="max-w-3xl mx-auto flex gap-3">
            <Input
              placeholder="Ask your advisor..."
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
      </div>

      {/* Right Panel - Context & Actions */}
      <div className="w-96 border-l border-border bg-card p-6 hidden xl:flex flex-col">
        <div className="text-sm font-medium text-foreground mb-6">Current Status</div>

        {/* Dynamic Content Based on Step */}
        {currentStep === 1 && selectedCareer && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-accent border border-border">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span className="font-medium text-foreground">Selected Career</span>
              </div>
              <p className="text-lg font-semibold text-primary">{selectedCareer}</p>
            </div>
            <Button variant="hero" className="w-full" onClick={proceedToSkills}>
              Validate My Skills
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-accent border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">Career Path Locked</span>
              </div>
              <p className="text-lg font-semibold text-primary">{selectedCareer}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Proceeding to skill assessment phase
              </p>
            </div>
            <Button variant="hero" className="w-full" onClick={proceedToSkills}>
              Continue to Skill Validation
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {currentStep >= 3 && (
          <div className="space-y-6 flex-1">
            <div className="text-sm text-muted-foreground mb-2">Skill Assessment</div>
            <div className="space-y-3">
              {skills.map((skill) => (
                <div key={skill.name} className="p-3 rounded-xl bg-muted/50 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{skill.name}</span>
                    <Badge
                      variant="secondary"
                      className={
                        skill.status === "ready"
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                      }
                    >
                      {skill.status === "ready" ? "Ready" : "Gap"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={(skill.current / skill.required) * 100}
                      className="h-1.5 flex-1"
                    />
                    <span className="text-xs text-muted-foreground">
                      {skill.current}/{skill.required}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-6">
              <Button variant="hero" className="w-full" onClick={proceedToLearn}>
                Start Learning
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 1 && !selectedCareer && (
          <div className="text-center text-muted-foreground text-sm p-6 rounded-xl bg-muted/50 border border-border">
            <Target className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            Select a career path from the chat to continue your journey
          </div>
        )}
      </div>
    </div>
  );
};

export default Advisor;
