import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ChevronRight,
  Play,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePageGuard, useJourneyState } from "@/hooks/useJourneyState";
import { useToast } from "@/hooks/use-toast";

interface Skill {
  id: string;
  name: string;
  progress: number;
  status: "not_started" | "in_progress" | "completed";
  priority: number;
}

const Learn = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { loading: guardLoading } = usePageGuard('skill_validated', '/advisor');
  const { updateState } = useJourneyState();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadLearningPlan();
    }
  }, [user]);

  const loadLearningPlan = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('learning_plan')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: true });

      if (error) throw error;

      if (data) {
        setSkills(data.map(item => ({
          id: item.id,
          name: item.skill_name,
          progress: item.status === 'completed' ? 100 : item.status === 'in_progress' ? 50 : 0,
          status: (item.status as 'not_started' | 'in_progress' | 'completed') || 'not_started',
          priority: item.priority || 1
        })));

        if (data.length > 0) {
          setExpandedSkill(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading learning plan:', error);
      toast({
        title: "Error",
        description: "Couldn't load your learning plan.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSkillStatus = async (skillId: string, newStatus: 'not_started' | 'in_progress' | 'completed') => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('learning_plan')
        .update({ status: newStatus })
        .eq('id', skillId)
        .eq('user_id', user.id);

      if (error) throw error;

      setSkills(skills.map(skill => {
        if (skill.id === skillId) {
          return {
            ...skill,
            status: newStatus,
            progress: newStatus === 'completed' ? 100 : newStatus === 'in_progress' ? 50 : 0
          };
        }
        return skill;
      }));

      // Check if all skills are completed
      const updatedSkills = skills.map(s => s.id === skillId ? { ...s, status: newStatus } : s);
      const allCompleted = updatedSkills.every(s => s.status === 'completed');

      if (allCompleted) {
        await updateState({ learning_completed: true });
        toast({
          title: "Congratulations!",
          description: "You've completed all skills. Moving to projects!",
        });
      }
    } catch (error) {
      console.error('Error updating skill status:', error);
      toast({
        title: "Error",
        description: "Couldn't update skill status.",
        variant: "destructive"
      });
    }
  };

  const overallProgress = skills.length > 0
    ? Math.round(skills.reduce((acc, skill) => acc + skill.progress, 0) / skills.length)
    : 0;

  const getStatusColor = (status: Skill["status"]) => {
    switch (status) {
      case "completed":
        return "bg-success/10 text-success";
      case "in_progress":
        return "bg-primary/10 text-primary";
      case "not_started":
        return "bg-muted text-muted-foreground";
    }
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
            onClick={() => navigate("/advisor")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Advisor
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Learning Path</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Progress Overview */}
        <div className="bg-card border border-border rounded-2xl p-8 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Skill Development</h1>
              <p className="text-muted-foreground">
                Complete these skills to become job-ready
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                {overallProgress}%
              </div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </div>

        {/* Skills List */}
        {skills.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No learning plan yet</h3>
            <p className="text-muted-foreground mb-4">
              Go back to the advisor to generate your personalized learning plan.
            </p>
            <Button variant="hero" onClick={() => navigate('/advisor')}>
              Go to Advisor
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="bg-card border border-border rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md"
              >
                {/* Skill Header */}
                <button
                  onClick={() => setExpandedSkill(expandedSkill === skill.id ? null : skill.id)}
                  className="w-full p-5 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        skill.status === "completed"
                          ? "bg-success"
                          : skill.status === "in_progress"
                          ? "bg-gradient-hero"
                          : "bg-muted"
                      }`}
                    >
                      {skill.status === "completed" ? (
                        <CheckCircle2 className="w-6 h-6 text-success-foreground" />
                      ) : (
                        <BookOpen
                          className={`w-6 h-6 ${
                            skill.status === "in_progress"
                              ? "text-primary-foreground"
                              : "text-muted-foreground"
                          }`}
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{skill.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="secondary" className={getStatusColor(skill.status)}>
                          {skill.status === "completed"
                            ? "Completed"
                            : skill.status === "in_progress"
                            ? "In Progress"
                            : "Not Started"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Priority: {skill.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32">
                      <Progress value={skill.progress} className="h-2" />
                    </div>
                    <span className="text-sm font-medium text-foreground w-10">{skill.progress}%</span>
                    <ChevronRight
                      className={`w-5 h-5 text-muted-foreground transition-transform ${
                        expandedSkill === skill.id ? "rotate-90" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Actions */}
                {expandedSkill === skill.id && (
                  <div className="px-5 pb-5 space-y-3 border-t border-border pt-4">
                    <div className="flex gap-3">
                      {skill.status !== 'in_progress' && skill.status !== 'completed' && (
                        <Button
                          variant="default"
                          onClick={() => updateSkillStatus(skill.id, 'in_progress')}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start Learning
                        </Button>
                      )}
                      {skill.status === 'in_progress' && (
                        <Button
                          variant="success"
                          onClick={() => updateSkillStatus(skill.id, 'completed')}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Mark as Completed
                        </Button>
                      )}
                      {skill.status === 'completed' && (
                        <Button
                          variant="outline"
                          onClick={() => updateSkillStatus(skill.id, 'in_progress')}
                        >
                          Undo Completion
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Continue Button */}
        <div className="mt-8 flex justify-center">
          <Button
            variant="hero"
            size="lg"
            onClick={() => navigate("/projects")}
            className="gap-2"
          >
            Continue to Projects
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Learn;
