import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Briefcase,
  FolderOpen,
  Target,
  Gauge,
} from "lucide-react";

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

const JobReadiness = () => {
  const navigate = useNavigate();
  
  const [resumeChecklist, setResumeChecklist] = useState<ChecklistItem[]>([
    { id: "r1", label: "Updated contact information", completed: true },
    { id: "r2", label: "Professional summary written", completed: true },
    { id: "r3", label: "Skills section includes all learned technologies", completed: true },
    { id: "r4", label: "Work experience formatted properly", completed: false },
    { id: "r5", label: "Education section complete", completed: true },
    { id: "r6", label: "Projects section with links", completed: false },
    { id: "r7", label: "Resume reviewed for typos", completed: false },
    { id: "r8", label: "PDF format ready to send", completed: false },
  ]);

  const [portfolioChecklist, setPortfolioChecklist] = useState<ChecklistItem[]>([
    { id: "p1", label: "Portfolio website deployed", completed: true },
    { id: "p2", label: "All projects have descriptions", completed: true },
    { id: "p3", label: "Live demos available", completed: true },
    { id: "p4", label: "GitHub links included", completed: false },
    { id: "p5", label: "Contact form working", completed: false },
    { id: "p6", label: "Mobile responsive design", completed: true },
  ]);

  const [skillConfidence, setSkillConfidence] = useState([
    { skill: "JavaScript", confidence: 85 },
    { skill: "React", confidence: 75 },
    { skill: "TypeScript", confidence: 60 },
    { skill: "Node.js", confidence: 65 },
    { skill: "Problem Solving", confidence: 80 },
    { skill: "Communication", confidence: 70 },
  ]);

  const toggleItem = (list: "resume" | "portfolio", id: string) => {
    if (list === "resume") {
      setResumeChecklist(
        resumeChecklist.map((item) =>
          item.id === id ? { ...item, completed: !item.completed } : item
        )
      );
    } else {
      setPortfolioChecklist(
        portfolioChecklist.map((item) =>
          item.id === id ? { ...item, completed: !item.completed } : item
        )
      );
    }
  };

  const resumeProgress = Math.round(
    (resumeChecklist.filter((i) => i.completed).length / resumeChecklist.length) * 100
  );
  const portfolioProgress = Math.round(
    (portfolioChecklist.filter((i) => i.completed).length / portfolioChecklist.length) * 100
  );
  const avgConfidence = Math.round(
    skillConfidence.reduce((acc, s) => acc + s.confidence, 0) / skillConfidence.length
  );
  const overallProgress = Math.round((resumeProgress + portfolioProgress + avgConfidence) / 3);

  const getConfidenceColor = (value: number) => {
    if (value >= 80) return "text-success";
    if (value >= 60) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/projects")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Projects
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Job Readiness</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Progress Overview */}
        <div className="bg-card border border-border rounded-2xl p-8 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Job Readiness Check</h1>
              <p className="text-muted-foreground">
                Ensure you're fully prepared for job applications
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                {overallProgress}%
              </div>
              <div className="text-sm text-muted-foreground">Overall Readiness</div>
            </div>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Resume Checklist */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Resume</h3>
                    <p className="text-sm text-muted-foreground">
                      {resumeChecklist.filter((i) => i.completed).length}/{resumeChecklist.length} complete
                    </p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={resumeProgress === 100 ? "bg-success/10 text-success" : ""}
                >
                  {resumeProgress}%
                </Badge>
              </div>
              <Progress value={resumeProgress} className="h-2 mt-4" />
            </div>
            <div className="p-4 space-y-3">
              {resumeChecklist.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => toggleItem("resume", item.id)}
                  />
                  <span
                    className={`text-sm ${
                      item.completed ? "text-muted-foreground line-through" : "text-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Portfolio Checklist */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Portfolio</h3>
                    <p className="text-sm text-muted-foreground">
                      {portfolioChecklist.filter((i) => i.completed).length}/{portfolioChecklist.length} complete
                    </p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={portfolioProgress === 100 ? "bg-success/10 text-success" : ""}
                >
                  {portfolioProgress}%
                </Badge>
              </div>
              <Progress value={portfolioProgress} className="h-2 mt-4" />
            </div>
            <div className="p-4 space-y-3">
              {portfolioChecklist.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => toggleItem("portfolio", item.id)}
                  />
                  <span
                    className={`text-sm ${
                      item.completed ? "text-muted-foreground line-through" : "text-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Skill Confidence */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm mb-8">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
                  <Gauge className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Skill Confidence</h3>
                  <p className="text-sm text-muted-foreground">
                    Your self-assessed readiness levels
                  </p>
                </div>
              </div>
              <div className={`text-2xl font-bold ${getConfidenceColor(avgConfidence)}`}>
                {avgConfidence}%
              </div>
            </div>
          </div>
          <div className="p-6 grid md:grid-cols-2 gap-4">
            {skillConfidence.map((skill) => (
              <div key={skill.skill} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{skill.skill}</span>
                  <span className={`text-sm font-medium ${getConfidenceColor(skill.confidence)}`}>
                    {skill.confidence}%
                  </span>
                </div>
                <Progress value={skill.confidence} className="h-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Action Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-hero flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Ready to Practice?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Before applying to jobs, practice your interview skills with our AI interviewer.
          </p>
          <Button
            variant="hero"
            size="lg"
            onClick={() => navigate("/interview")}
            className="gap-2"
          >
            Start AI Interview
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JobReadiness;
