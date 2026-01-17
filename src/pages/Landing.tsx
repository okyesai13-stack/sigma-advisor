import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import sigmaLogo from "@/assets/sigma-logo.png";
import { 
  Plus, 
  Mic, 
  ArrowUp, 
  Briefcase, 
  GraduationCap, 
  Target, 
  FileText, 
  Users,
  ChevronDown
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");

  const suggestionChips = [
    { icon: "🎯", text: "How to switch careers in tech" },
    { icon: "📊", text: "Skills needed for data science" },
    { icon: "💼", text: "Tips for a strong LinkedIn profile" },
    { icon: "🎓", text: "Best certifications for cloud computing" },
    { icon: "📝", text: "How to prepare for interviews" },
    { icon: "🚀", text: "Career growth strategies for 2025" },
    { icon: "💡", text: "How to negotiate salary" },
    { icon: "🌟", text: "Building a portfolio for beginners" },
  ];

  const handleSubmit = () => {
    if (inputValue.trim()) {
      navigate("/auth");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-primary/5 via-pink-200/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-blue-200/20 via-primary/5 to-transparent rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={sigmaLogo} alt="Sigma" className="w-8 h-8" />
            <span className="font-bold text-xl text-foreground">Sigma</span>
          </div>
          <Button 
            variant="default" 
            onClick={() => navigate("/auth")}
            className="rounded-full px-6"
          >
            Login
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 pt-16">
        {/* Logo/Icon */}
        <div className="mb-6 animate-fade-in">
          <div className="w-16 h-16 relative">
            <svg viewBox="0 0 100 100" className="w-full h-full text-primary/60">
              <path
                d="M50 10 L50 40 M30 25 L50 45 L70 25 M50 45 L50 75 M30 60 L50 40 L70 60 M40 80 L50 65 L60 80"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="50" cy="90" r="5" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* Greeting */}
        <div className="text-center mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
            Hello there!
          </h1>
          <p className="text-3xl md:text-4xl font-bold text-foreground/80">
            What's on your mind?
          </p>
        </div>

        {/* Search Input Box */}
        <div 
          className="w-full max-w-2xl mb-8 animate-fade-in" 
          style={{ animationDelay: "0.2s" }}
        >
          <div className="bg-card border border-border rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            {/* Input area */}
            <div className="p-4">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your career..."
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none text-lg min-h-[60px]"
                rows={2}
              />
            </div>

            {/* Bottom toolbar */}
            <div className="flex items-center justify-between px-4 pb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Plus className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => navigate("/auth")}
                >
                  <Target className="w-4 h-4" />
                  Career Analysis
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => navigate("/auth")}
                >
                  <Briefcase className="w-4 h-4" />
                  Job Match
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Mic className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  className={`rounded-full h-10 w-10 transition-all duration-200 ${
                    inputValue.trim() 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "bg-muted text-muted-foreground"
                  }`}
                  onClick={handleSubmit}
                  disabled={!inputValue.trim()}
                >
                  <ArrowUp className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div 
          className="w-full max-w-3xl animate-fade-in" 
          style={{ animationDelay: "0.3s" }}
        >
          <div className="flex flex-wrap justify-center gap-3">
            {suggestionChips.map((chip, index) => (
              <button
                key={index}
                onClick={() => navigate("/auth")}
                className="group flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-full text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-accent/50 transition-all duration-200 hover:shadow-md"
              >
                <span>{chip.icon}</span>
                <span>{chip.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scroll indicator for more content */}
        <div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: "smooth" })}
        >
          <ChevronDown className="w-6 h-6 text-muted-foreground" />
        </div>
      </main>

      {/* Quick Features Section */}
      <section className="relative z-10 py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-3">
              <img src={sigmaLogo} alt="Sigma" className="w-10 h-10" />
              <span className="text-3xl md:text-4xl font-bold text-foreground">Sigma</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Your AI Career Companion
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Get personalized guidance for every step of your career journey
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {[
              { icon: Target, title: "Career Analysis", desc: "Discover your path" },
              { icon: GraduationCap, title: "Skill Building", desc: "Learn what matters" },
              { icon: FileText, title: "Resume Builder", desc: "Stand out from crowd" },
              { icon: Users, title: "Interview Prep", desc: "Ace every interview" },
            ].map((feature, index) => (
              <div
                key={feature.title}
                onClick={() => navigate("/auth")}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg cursor-pointer transition-all duration-300 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-6 px-6 border-t border-border bg-background">
        <div className="container mx-auto flex items-center justify-between text-muted-foreground text-sm">
          <div className="flex items-center gap-2">
            <img src={sigmaLogo} alt="Sigma" className="w-5 h-5" />
            <span>Sigma Career Advisor</span>
          </div>
          <span>© 2025 All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
