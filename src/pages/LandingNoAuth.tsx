import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  ArrowRight, 
  Brain, 
  Target, 
  Rocket,
  Zap,
  CheckCircle2,
} from "lucide-react";

const LandingNoAuth = () => {
  const navigate = useNavigate();

  const features = [
    { icon: Brain, title: "AI Career Analysis", description: "Get personalized career paths powered by Gemini 3" },
    { icon: Target, title: "Skill Validation", description: "See exactly where you stand and what to improve" },
    { icon: Rocket, title: "Learning Roadmap", description: "Step-by-step plan to reach your dream role" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="container mx-auto px-6 py-4">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Sigma Advisor
            </span>
          </div>
          <Badge variant="outline" className="gap-1">
            <Zap className="w-3 h-3" />
            Powered by Gemini 3
          </Badge>
        </nav>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-6 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
            🚀 Google DeepMind Gemini 3 Hackathon
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            AI Career Clarity
            <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              In One Flow
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Upload your resume, set your goal, and get a personalized career roadmap 
            instantly — no login required.
          </p>

          <Button 
            size="lg" 
            className="h-14 px-8 text-lg gap-2"
            onClick={() => navigate('/setup')}
          >
            Start Without Login
            <ArrowRight className="w-5 h-5" />
          </Button>

          <p className="text-sm text-muted-foreground mt-4">
            Takes less than 2 minutes • Completely free
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: 1, title: "Set Your Goal", desc: "Tell us your dream career" },
              { step: 2, title: "Upload Resume", desc: "We analyze your experience" },
              { step: 3, title: "AI Analysis", desc: "Gemini 3 creates your roadmap" },
              { step: 4, title: "Get Results", desc: "Full dashboard with action plan" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 font-bold">
                  {item.step}
                </div>
                <h3 className="font-medium mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            No account needed
            <CheckCircle2 className="w-4 h-4 text-green-500 ml-4" />
            Instant results
            <CheckCircle2 className="w-4 h-4 text-green-500 ml-4" />
            100% free
          </div>
          <div>
            <Button 
              size="lg" 
              className="h-14 px-8 text-lg gap-2"
              onClick={() => navigate('/setup')}
            >
              Start Your Career Analysis
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 mt-16 border-t border-border/50">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>Built for Google DeepMind Gemini 3 Hackathon</p>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Sigma Advisor
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingNoAuth;
