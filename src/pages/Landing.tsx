import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, Target, BookOpen, Briefcase, TrendingUp, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useJourneyState } from "@/hooks/useJourneyState";
import { toast } from "sonner";

const Landing = () => {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const { journeyState, loading: journeyLoading } = useJourneyState();

  const getNextRoute = () => {
    if (!journeyState) return "/setup";
    if (!journeyState.profile_completed) return "/setup";
    if (!journeyState.career_analysis_completed) return "/sigma";
    if (!journeyState.skill_validation_completed) return "/sigma";
    if (!journeyState.learning_plan_completed) return "/sigma";
    if (!journeyState.project_plan_completed) return "/sigma";
    if (!journeyState.job_matching_completed) return "/sigma";
    if (!journeyState.interview_completed) return "/sigma";
    return "/advisor";
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
    }
  };

  const features = [
    {
      icon: Target,
      title: "Set Your Goal",
      description: "Define your career aspirations and get personalized guidance",
    },
    {
      icon: BookOpen,
      title: "Learn Skills",
      description: "Close skill gaps with curated learning resources",
    },
    {
      icon: Briefcase,
      title: "Land Your Job",
      description: "Prepare for interviews and apply with confidence",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg text-foreground">AI Career Advisor</span>
          </div>
          {loading || journeyLoading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          ) : user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {user.email}
              </span>
              <Button variant="outline" onClick={() => navigate(getNextRoute())}>
                Continue Journey
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              Your AI-Powered Career Guide
            </div>
          </div>

          <h1 
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 animate-slide-up text-balance leading-tight"
            style={{ animationDelay: "0.2s" }}
          >
            Your Personal
            <span className="block bg-gradient-hero bg-clip-text text-transparent">
              AI Career Advisor
            </span>
          </h1>

          <p 
            className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up text-balance"
            style={{ animationDelay: "0.3s" }}
          >
            Get guided step by step toward the right career, skills, and job.
          </p>

          <div 
            className="animate-slide-up"
            style={{ animationDelay: "0.4s" }}
          >
            <Button 
              variant="hero" 
              size="xl" 
              onClick={() => navigate(user ? getNextRoute() : "/auth")}
              className="group"
            >
              {user ? "Continue Journey" : "Ask Advisor"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group p-8 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${0.5 + index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-5 group-hover:bg-gradient-hero transition-all duration-300">
                  <feature.icon className="w-6 h-6 text-accent-foreground group-hover:text-primary-foreground transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 border-t border-border">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { value: "10K+", label: "Career Paths" },
              { value: "95%", label: "Success Rate" },
              { value: "24/7", label: "AI Support" },
            ].map((stat, index) => (
              <div 
                key={stat.label} 
                className="animate-slide-up"
                style={{ animationDelay: `${0.8 + index * 0.1}s` }}
              >
                <div className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-3xl">
          <div className="relative p-12 rounded-3xl bg-card border border-border shadow-lg overflow-hidden animate-scale-in" style={{ animationDelay: "1s" }}>
            <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>
            <div className="relative text-center">
              <TrendingUp className="w-12 h-12 text-primary mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Ready to Start Your Journey?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Join thousands of professionals who transformed their careers with personalized AI guidance.
              </p>
              <Button 
                variant="hero" 
                size="lg" 
                onClick={() => navigate(user ? getNextRoute() : "/auth")}
                className="group"
              >
                {user ? "Continue Journey" : "Get Started Free"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="container mx-auto text-center text-muted-foreground text-sm">
          © 2026 AI Career Advisor. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
