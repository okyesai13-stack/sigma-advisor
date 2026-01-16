import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, Target, BookOpen, Briefcase, TrendingUp, ChevronDown } from "lucide-react";
import {
  FloatingParticles,
  HowItWorks,
  Testimonials,
  FAQ,
  TrustedBy,
  AnimatedStats,
} from "@/components/landing";

const Landing = () => {
  const navigate = useNavigate();

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
          <Button variant="outline" onClick={() => navigate("/auth")}>
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden min-h-[90vh] flex items-center">
        <FloatingParticles />
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-8 hover:scale-105 transition-transform cursor-default">
              <Sparkles className="w-4 h-4 animate-pulse" />
              Your AI-Powered Career Guide
            </div>
          </div>

          <h1 
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 animate-slide-up text-balance leading-tight"
            style={{ animationDelay: "0.2s" }}
          >
            Your Personal
            <span className="block bg-gradient-hero bg-clip-text text-transparent animate-pulse">
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
            className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up"
            style={{ animationDelay: "0.4s" }}
          >
            <Button 
              variant="hero" 
              size="xl" 
              onClick={() => navigate("/auth")}
              className="group"
            >
              Ask Advisor
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              className="group"
            >
              Learn More
              <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
            </Button>
          </div>

          {/* Scroll indicator */}
          <div 
            className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer"
            onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
          >
            <ChevronDown className="w-6 h-6 text-muted-foreground" />
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <TrustedBy />

      {/* How It Works Section */}
      <div id="how-it-works">
        <HowItWorks />
      </div>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose Us
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to accelerate your career journey
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group p-8 rounded-2xl bg-card border border-border shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 animate-slide-up cursor-pointer"
                style={{ animationDelay: `${0.5 + index * 0.1}s` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-5 group-hover:bg-gradient-hero group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="w-7 h-7 text-accent-foreground group-hover:text-primary-foreground transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <Testimonials />

      {/* Stats Section */}
      <AnimatedStats />

      {/* FAQ Section */}
      <FAQ />

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-3xl">
          <div className="relative p-12 md:p-16 rounded-3xl bg-gradient-to-br from-card via-card to-accent/20 border border-border shadow-2xl overflow-hidden group hover:shadow-3xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-hero opacity-5 group-hover:opacity-10 transition-opacity"></div>
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="relative text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-hero flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                Ready to Start Your Journey?
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
                Join thousands of professionals who transformed their careers with personalized AI guidance.
              </p>
              <Button 
                variant="hero" 
                size="xl" 
                onClick={() => navigate("/auth")}
                className="group/btn"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
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
