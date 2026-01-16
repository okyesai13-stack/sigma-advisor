import { Upload, Brain, Target, Rocket } from "lucide-react";
import { useState } from "react";

const steps = [
  {
    icon: Upload,
    number: "01",
    title: "Upload Your Resume",
    description: "Share your background and experience with our AI system for personalized analysis.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Brain,
    number: "02",
    title: "AI Analysis",
    description: "Our AI evaluates your skills, experience, and identifies career opportunities.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Target,
    number: "03",
    title: "Get Recommendations",
    description: "Receive tailored career paths, skill gaps, and learning resources.",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: Rocket,
    number: "04",
    title: "Launch Your Career",
    description: "Apply with confidence using AI-crafted resumes and interview prep.",
    color: "from-green-500 to-emerald-500",
  },
];

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your journey to the perfect career in four simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`relative group cursor-pointer transition-all duration-500 ${
                activeStep === index ? "scale-105" : ""
              }`}
              onMouseEnter={() => setActiveStep(index)}
              onMouseLeave={() => setActiveStep(null)}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-border to-transparent z-0" />
              )}

              <div className="relative p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-xl transition-all duration-300 h-full group-hover:border-primary/50">
                {/* Step number badge */}
                <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-sm font-bold shadow-lg">
                  {step.number}
                </div>

                {/* Icon */}
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                >
                  <step.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
