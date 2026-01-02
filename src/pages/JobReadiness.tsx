import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePageGuard, useJourneyState } from "@/hooks/useJourneyState";
import { useToast } from "@/hooks/use-toast";

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

const JobReadiness = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { loading: guardLoading } = usePageGuard('projects_completed', '/projects');
  const { updateState } = useJourneyState();

  const [resumeReady, setResumeReady] = useState(false);
  const [portfolioReady, setPortfolioReady] = useState(false);
  const [confidenceLevel, setConfidenceLevel] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [resumeChecklist, setResumeChecklist] = useState<ChecklistItem[]>([
    { id: "r1", label: "Updated contact information", completed: false },
    { id: "r2", label: "Professional summary written", completed: false },
    { id: "r3", label: "Skills section includes all learned technologies", completed: false },
    { id: "r4", label: "Work experience formatted properly", completed: false },
    { id: "r5", label: "Education section complete", completed: false },
    { id: "r6", label: "Projects section with links", completed: false },
    { id: "r7", label: "Resume reviewed for typos", completed: false },
    { id: "r8", label: "PDF format ready to send", completed: false },
  ]);

  const [portfolioChecklist, setPortfolioChecklist] = useState<ChecklistItem[]>([
    { id: "p1", label: "Portfolio website deployed", completed: false },
    { id: "p2", label: "All projects have descriptions", completed: false },
    { id: "p3", label: "Live demos available", completed: false },
    { id: "p4", label: "GitHub links included", completed: false },
    { id: "p5", label: "Contact form working", completed: false },
    { id: "p6", label: "Mobile responsive design", completed: false },
  ]);

  const [skillConfidence, setSkillConfidence] = useState<{ skill: string; confidence: number }[]>([]);

  useEffect(() => {
    if (user) {
      loadJobReadiness();
    }
  }, [user]);

  const loadJobReadiness = async () => {
    if (!user) return;

    try {
      // Load existing job readiness data
      const { data: readiness } = await supabase
        .from('job_readiness')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (readiness) {
        setResumeReady(readiness.resume_ready || false);
        setPortfolioReady(readiness.portfolio_ready || false);
        setConfidenceLevel(readiness.confidence_level || 0);
      }

      // Load skill validations for confidence display
      const { data: skills } = await supabase
        .from('user_skill_validation')
        .select('skill_name, current_level, required_level')
        .eq('user_id', user.id);

      if (skills) {
        setSkillConfidence(skills.map(s => ({
          skill: s.skill_name,
          confidence: Math.round((parseInt(s.current_level || '1') / parseInt(s.required_level || '4')) * 100)
        })));
      }

      // Call update-job-readiness to calculate current state
      await supabase.functions.invoke('update-job-readiness', {
        body: {
          resume_ready: resumeReady,
          portfolio_ready: portfolioReady,
          confidence_level: confidenceLevel
        }
      });

    } catch (error) {
      console.error('Error loading job readiness:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleItem = async (list: "resume" | "portfolio", id: string) => {
    if (list === "resume") {
      const updated = resumeChecklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      );
      setResumeChecklist(updated);

      const allComplete = updated.every(i => i.completed);
      setResumeReady(allComplete);
    } else {
      const updated = portfolioChecklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      );
      setPortfolioChecklist(updated);

      const allComplete = updated.every(i => i.completed);
      setPortfolioReady(allComplete);
    }
  };

  const saveReadiness = async () => {
    if (!user) return;

    try {
      const resumeProgress = Math.round(
        (resumeChecklist.filter((i) => i.completed).length / resumeChecklist.length) * 100
      );
      const portfolioProgress = Math.round(
        (portfolioChecklist.filter((i) => i.completed).length / portfolioChecklist.length) * 100
      );
      const avgConfidence = skillConfidence.length > 0
        ? Math.round(skillConfidence.reduce((acc, s) => acc + s.confidence, 0) / skillConfidence.length)
        : 0;

      const { data, error } = await supabase.functions.invoke('update-job-readiness', {
        body: {
          resume_ready: resumeProgress === 100,
          portfolio_ready: portfolioProgress === 100,
          confidence_level: Math.round((resumeProgress + portfolioProgress + avgConfidence) / 3)
        }
      });

      if (error) throw error;

      toast({
        title: "Progress saved",
        description: "Your job readiness has been updated.",
      });

      // If job ready, update journey state
      if (data?.job_ready) {
        await updateState({ job_ready: true });
      }

    } catch (error) {
      console.error('Error saving job readiness:', error);
      toast({
        title: "Error",
        description: "Couldn't save your progress.",
        variant: "destructive"
      });
    }
  };

  const resumeProgress = Math.round(
    (resumeChecklist.filter((i) => i.completed).length / resumeChecklist.length) * 100
  );
  const portfolioProgress = Math.round(
    (portfolioChecklist.filter((i) => i.completed).length / portfolioChecklist.length) * 100
  );
  const avgConfidence = skillConfidence.length > 0
    ? Math.round(skillConfidence.reduce((acc, s) => acc + s.confidence, 0) / skillConfidence.length)
    : 70;
  const overallProgress = Math.round((resumeProgress + portfolioProgress + avgConfidence) / 3);

  const getConfidenceColor = (value: number) => {
    if (value >= 80) return "text-success";
    if (value >= 60) return "text-warning";
    return "text-destructive";
  };

  if (guardLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
        {skillConfidence.length > 0 && (
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
                      Your assessed skill levels
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
        )}

        {/* Save & Action Card */}
        <div className="flex justify-center mb-8">
          <Button variant="outline" onClick={saveReadiness}>
            Save Progress
          </Button>
        </div>

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
