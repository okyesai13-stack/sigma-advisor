import { useState, useEffect } from "react";
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
  User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useJourneyState, usePageGuard } from "@/hooks/useJourneyState";

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

interface SkillValidation {
  name: string;
  required: number;
  current: number;
  status: string;
}

const Advisor = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { loading: guardLoading } = usePageGuard('profile_completed', '/setup');
  const { journeyState, refreshState, updateState } = useJourneyState();

  const [currentStep, setCurrentStep] = useState(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedCareer, setSelectedCareer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [careerOptions, setCareerOptions] = useState<CareerOption[]>([]);
  const [skills, setSkills] = useState<SkillValidation[]>([]);
  const [userGoal, setUserGoal] = useState<{ type: string; description: string } | null>(null);

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

  // Load initial data
  useEffect(() => {
    if (!user) return;
    loadInitialData();
  }, [user]);

  const loadInitialData = async () => {
    if (!user) return;

    try {
      // Load user profile for goal
      const { data: profile } = await supabase
        .from('users_profile')
        .select('goal_type, goal_description')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserGoal({
          type: profile.goal_type || 'Find a Job',
          description: profile.goal_description || 'Become a professional in your field'
        });
      }

      // Load selected career if exists
      const { data: career } = await supabase
        .from('selected_career')
        .select('career_title')
        .eq('user_id', user.id)
        .single();

      if (career) {
        setSelectedCareer(career.career_title);
      }

      // Load conversation history
      const { data: conversations } = await supabase
        .from('advisor_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (conversations && conversations.length > 0) {
        setMessages(conversations.map(c => ({
          role: c.role as 'user' | 'assistant',
          content: c.message
        })));
      } else {
        setMessages([{
          role: "assistant",
          content: "Welcome! Based on your profile, I've analyzed your goals, interests, and background. I'm ready to recommend career paths that align perfectly with your aspirations. Let's find your ideal career direction.",
        }]);
      }

      // Load career recommendations if they exist
      const { data: recommendations } = await supabase
        .from('career_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .order('confidence_score', { ascending: false });

      if (recommendations && recommendations.length > 0) {
        setCareerOptions(recommendations.map(r => ({
          title: r.career_title,
          match: r.confidence_score || 0,
          description: r.rationale || '',
          skills: []
        })));
      }

      // Load skill validations
      const { data: skillValidations } = await supabase
        .from('user_skill_validation')
        .select('*')
        .eq('user_id', user.id);

      if (skillValidations && skillValidations.length > 0) {
        setSkills(skillValidations.map(s => ({
          name: s.skill_name,
          required: parseInt(s.required_level || '3'),
          current: parseInt(s.current_level || '1'),
          status: s.status || 'gap'
        })));
      }

      // Update current step based on journey state
      if (journeyState) {
        if (!journeyState.career_recommended) setCurrentStep(1);
        else if (!journeyState.career_selected) setCurrentStep(1);
        else if (!journeyState.skill_validated) setCurrentStep(3);
        else setCurrentStep(4);
      }

    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  // Generate career recommendations
  const generateRecommendations = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-career-recommendation', {
        body: {}
      });

      if (error) throw error;

      if (data?.recommendations) {
        setCareerOptions(data.recommendations.map((r: any) => ({
          title: r.career_title,
          match: r.confidence_score,
          description: r.rationale,
          skills: []
        })));

        setMessages(prev => [...prev, {
          role: "assistant",
          content: "Based on your profile, I've generated personalized career recommendations for you. Select one that interests you to continue your journey!"
        }]);

        await refreshState();
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast({
        title: "Error",
        description: "Couldn't generate recommendations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user) return;

    const userMessage: Message = { role: "user", content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

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
      const fallbackResponse: Message = {
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again."
      };
      setMessages((prev) => [...prev, fallbackResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectCareer = async (title: string) => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('select-career-path', {
        body: { career_title: title }
      });

      if (error) throw error;

      setSelectedCareer(title);
      setCurrentStep(2);
      setMessages([
        ...messages,
        {
          role: "assistant",
          content: `Excellent choice! You've selected ${title} as your career path. This is a great match based on your profile. Let me now validate your current skills and identify any gaps we need to address.`,
        },
      ]);

      await refreshState();
    } catch (error) {
      console.error('Error selecting career:', error);
      toast({
        title: "Error",
        description: "Couldn't save your career selection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const proceedToSkills = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('validate-skills', {
        body: {}
      });

      if (error) throw error;

      if (data?.skills) {
        setSkills(data.skills.map((s: any) => ({
          name: s.skill_name,
          required: parseInt(s.required_level || '3'),
          current: parseInt(s.current_level || '1'),
          status: s.status || 'gap'
        })));
      }

      setCurrentStep(3);
      setMessages([
        ...messages,
        {
          role: "assistant",
          content: "I've analyzed your skills against industry requirements. You have some gaps to close, but don't worry – I'll create a personalized learning path for you. Review your skill assessment on the right panel.",
        },
      ]);

      await refreshState();
    } catch (error) {
      console.error('Error validating skills:', error);
      toast({
        title: "Error",
        description: "Couldn't validate skills. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const proceedToLearn = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Generate learning plan
      await supabase.functions.invoke('generate-learning-plan', {
        body: {}
      });

      navigate("/learn");
    } catch (error) {
      console.error('Error generating learning plan:', error);
      navigate("/learn");
    } finally {
      setIsLoading(false);
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
              {userGoal?.type || 'Find a Job'}
            </div>
            <p className="text-sm text-muted-foreground">
              {userGoal?.description || 'Become a professional in your field'}
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
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${step.id === currentStep
                  ? "bg-accent text-accent-foreground"
                  : step.id < currentStep
                    ? "text-success"
                    : "text-muted-foreground"
                  }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step.id < currentStep
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
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Profile
            </Button>
            <Badge variant="secondary" className="bg-accent text-accent-foreground">
              Step {currentStep}: {steps[currentStep - 1].label}
            </Badge>
          </div>
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
                  className={`max-w-[80%] p-4 rounded-2xl ${message.role === "user"
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
            {currentStep === 1 && !selectedCareer && careerOptions.length > 0 && (
              <div className="space-y-4">
                <div className="text-center text-muted-foreground text-sm">
                  Select a career path that interests you
                </div>
                <div className="grid gap-4">
                  {careerOptions.map((career) => (
                    <button
                      key={career.title}
                      onClick={() => selectCareer(career.title)}
                      disabled={isLoading}
                      className="p-5 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all text-left group disabled:opacity-50"
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
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Generate recommendations button */}
            {currentStep === 1 && !selectedCareer && careerOptions.length === 0 && (
              <div className="text-center py-8">
                <Button
                  variant="hero"
                  size="lg"
                  onClick={generateRecommendations}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Career Recommendations
                    </>
                  )}
                </Button>
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
              onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSendMessage()}
              className="flex-1 h-12"
              disabled={isLoading}
            />
            <Button variant="hero" size="lg" onClick={handleSendMessage} disabled={isLoading}>
              {isLoading ? <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" /> : <Send className="w-5 h-5" />}
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
            <Button variant="hero" className="w-full" onClick={proceedToSkills} disabled={isLoading}>
              {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" /> : (
                <>
                  Validate My Skills
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
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
            <Button variant="hero" className="w-full" onClick={proceedToSkills} disabled={isLoading}>
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
              <Button variant="hero" className="w-full" onClick={proceedToLearn} disabled={isLoading}>
                Start Learning
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 1 && !selectedCareer && (
          <div className="text-center text-muted-foreground text-sm p-6 rounded-xl bg-muted/50 border border-border">
            <Target className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            {careerOptions.length === 0 
              ? "Click 'Generate Career Recommendations' to get personalized career paths"
              : "Select a career path from the chat to continue your journey"
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default Advisor;
