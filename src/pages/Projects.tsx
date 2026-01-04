import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import {
  Code,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Target,
  Layers,
  Loader2,
  Lightbulb,
  Hammer,
  Bot,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePageGuard, useJourneyState } from "@/hooks/useJourneyState";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface Project {
  id: string;
  project_id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  skills: string[];
  status: "not_started" | "in_progress" | "completed";
}

interface ProjectSteps {
  id: string;
  plan_steps: string[];
  build_steps: string[];
  ai_tools: { name: string; description: string; url?: string }[];
  plan_completed: boolean[];
  build_completed: boolean[];
}

const Projects = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { loading: guardLoading } = usePageGuard('learning_completed', '/learn');
  const { updateState, journeyState } = useJourneyState();

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectSteps, setProjectSteps] = useState<ProjectSteps | null>(null);
  const [analyzingProject, setAnalyzingProject] = useState(false);
  const [updatingReadiness, setUpdatingReadiness] = useState(false);

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    if (!user) return;

    try {
      // First check if user has projects assigned
      const { data: userProjects, error: upError } = await supabase
        .from('user_projects')
        .select(`
          id,
          project_id,
          status,
          projects (
            id,
            project_title,
            description,
            difficulty,
            skills_covered
          )
        `)
        .eq('user_id', user.id);

      if (upError) throw upError;

      if (!userProjects || userProjects.length === 0) {
        // Call assign-projects edge function
        const { data, error } = await supabase.functions.invoke('assign-projects', {
          body: {}
        });

        if (error) {
          console.error('Error assigning projects:', error);
        }

        // Reload after assignment
        const { data: newProjects } = await supabase
          .from('user_projects')
          .select(`
            id,
            project_id,
            status,
            projects (
              id,
              project_title,
              description,
              difficulty,
              skills_covered
            )
          `)
          .eq('user_id', user.id);

        if (newProjects) {
          setProjects(newProjects.map(up => ({
            id: up.id,
            project_id: up.project_id,
            title: (up.projects as any)?.project_title || 'Untitled Project',
            description: (up.projects as any)?.description || '',
            difficulty: ((up.projects as any)?.difficulty as 'beginner' | 'intermediate' | 'advanced') || 'beginner',
            skills: (up.projects as any)?.skills_covered || [],
            status: (up.status as 'not_started' | 'in_progress' | 'completed') || 'not_started'
          })));
        }
      } else {
        setProjects(userProjects.map(up => ({
          id: up.id,
          project_id: up.project_id,
          title: (up.projects as any)?.project_title || 'Untitled Project',
          description: (up.projects as any)?.description || '',
          difficulty: ((up.projects as any)?.difficulty as 'beginner' | 'intermediate' | 'advanced') || 'beginner',
          skills: (up.projects as any)?.skills_covered || [],
          status: (up.status as 'not_started' | 'in_progress' | 'completed') || 'not_started'
        })));
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: "Error",
        description: "Couldn't load your projects.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProjectStatus = async (projectId: string, newStatus: 'not_started' | 'in_progress' | 'completed') => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_projects')
        .update({ status: newStatus })
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) throw error;

      setProjects(projects.map(p => {
        if (p.id === projectId) {
          return { ...p, status: newStatus };
        }
        return p;
      }));

      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject({ ...selectedProject, status: newStatus });
      }

      // Check if all projects are completed
      const updatedProjects = projects.map(p => p.id === projectId ? { ...p, status: newStatus } : p);
      const allCompleted = updatedProjects.every(p => p.status === 'completed');

      if (allCompleted) {
        await updateState({ projects_completed: true });
        toast({
          title: "Congratulations!",
          description: "You've completed all projects!",
        });
      }

      if (newStatus === 'completed') {
        setProjectSteps(null);
        setSelectedProject(null);
      }
    } catch (error) {
      console.error('Error updating project status:', error);
      toast({
        title: "Error",
        description: "Couldn't update project status.",
        variant: "destructive"
      });
    }
  };

  const startProject = async () => {
    if (!user || !selectedProject) return;

    setAnalyzingProject(true);
    try {
      // First update status to in_progress
      await supabase
        .from('user_projects')
        .update({ status: 'in_progress' })
        .eq('id', selectedProject.id)
        .eq('user_id', user.id);

      setSelectedProject({ ...selectedProject, status: 'in_progress' });
      setProjects(projects.map(p => 
        p.id === selectedProject.id ? { ...p, status: 'in_progress' } : p
      ));

      // Call analyze-project edge function
      const { data, error } = await supabase.functions.invoke('analyze-project', {
        body: {
          userProjectId: selectedProject.id,
          projectTitle: selectedProject.title,
          projectDescription: selectedProject.description,
          skills: selectedProject.skills
        }
      });

      if (error) throw error;

      if (data?.steps) {
        setProjectSteps({
          id: data.steps.id,
          plan_steps: data.steps.plan_steps || [],
          build_steps: data.steps.build_steps || [],
          ai_tools: data.steps.ai_tools || [],
          plan_completed: data.steps.plan_completed || [],
          build_completed: data.steps.build_completed || [],
        });
      }

      toast({
        title: "Project Analysis Complete!",
        description: "Your personalized project steps are ready.",
      });
    } catch (error) {
      console.error('Error starting project:', error);
      toast({
        title: "Error",
        description: "Couldn't analyze project. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAnalyzingProject(false);
    }
  };

  const loadProjectSteps = async (userProjectId: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_project_steps')
      .select('*')
      .eq('user_project_id', userProjectId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setProjectSteps({
        id: data.id,
        plan_steps: (data.plan_steps as string[]) || [],
        build_steps: (data.build_steps as string[]) || [],
        ai_tools: (data.ai_tools as { name: string; description: string; url?: string }[]) || [],
        plan_completed: (data.plan_completed as boolean[]) || [],
        build_completed: (data.build_completed as boolean[]) || [],
      });
    } else {
      setProjectSteps(null);
    }
  };

  const toggleStepComplete = async (type: 'plan' | 'build', index: number) => {
    if (!user || !projectSteps) return;

    const field = type === 'plan' ? 'plan_completed' : 'build_completed';
    const currentArray = type === 'plan' ? projectSteps.plan_completed : projectSteps.build_completed;
    const newArray = [...currentArray];
    newArray[index] = !newArray[index];

    try {
      const { error } = await supabase
        .from('user_project_steps')
        .update({ [field]: newArray })
        .eq('id', projectSteps.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setProjectSteps({
        ...projectSteps,
        [field === 'plan_completed' ? 'plan_completed' : 'build_completed']: newArray
      });
    } catch (error) {
      console.error('Error updating step:', error);
    }
  };

  // Load steps when selecting a project that's in progress
  useEffect(() => {
    if (selectedProject && selectedProject.status !== 'not_started') {
      loadProjectSteps(selectedProject.id);
    } else {
      setProjectSteps(null);
    }
  }, [selectedProject?.id]);

  const getDifficultyColor = (difficulty: Project["difficulty"]) => {
    switch (difficulty) {
      case "beginner":
        return "bg-success/10 text-success";
      case "intermediate":
        return "bg-warning/10 text-warning";
      case "advanced":
        return "bg-destructive/10 text-destructive";
    }
  };

  const getStatusIcon = (status: Project["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-primary" />;
      case "not_started":
        return <Target className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const completedCount = projects.filter((p) => p.status === "completed").length;
  const overallProgress = projects.length > 0 ? Math.round((completedCount / projects.length) * 100) : 0;

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
            onClick={() => navigate("/learn")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Learning
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Projects</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Progress Overview */}
        <div className="bg-card border border-border rounded-2xl p-8 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Portfolio Projects</h1>
              <p className="text-muted-foreground">
                Build real-world projects to demonstrate your skills
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                {completedCount}/{projects.length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </div>

        {selectedProject ? (
          /* Project Detail View */
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm animate-scale-in">
            <div className="p-8 border-b border-border">
              <button
                onClick={() => setSelectedProject(null)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Projects
              </button>

              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="secondary" className={getDifficultyColor(selectedProject.difficulty)}>
                    {selectedProject.difficulty}
                  </Badge>
                  <h2 className="text-2xl font-bold text-foreground mt-3">
                    {selectedProject.title}
                  </h2>
                  <p className="text-muted-foreground mt-2">{selectedProject.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {selectedProject.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Project Steps Section */}
            {analyzingProject ? (
              <div className="p-8 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Analyzing project and generating steps...</p>
              </div>
            ) : projectSteps ? (
              <div className="p-8 space-y-8">
                {/* Plan Steps */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Plan Steps</h3>
                  </div>
                  <div className="space-y-3">
                    {projectSteps.plan_steps.map((step, index) => (
                      <div 
                        key={index} 
                        className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                      >
                        <Checkbox
                          checked={projectSteps.plan_completed[index] || false}
                          onCheckedChange={() => toggleStepComplete('plan', index)}
                          className="mt-0.5"
                        />
                        <span className={`text-sm ${projectSteps.plan_completed[index] ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Build Steps */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Hammer className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Build Steps</h3>
                  </div>
                  <div className="space-y-3">
                    {projectSteps.build_steps.map((step, index) => (
                      <div 
                        key={index} 
                        className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                      >
                        <Checkbox
                          checked={projectSteps.build_completed[index] || false}
                          onCheckedChange={() => toggleStepComplete('build', index)}
                          className="mt-0.5"
                        />
                        <span className={`text-sm ${projectSteps.build_completed[index] ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Tools */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Bot className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">AI Tools to Help</h3>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {projectSteps.ai_tools.map((tool, index) => (
                      <div 
                        key={index} 
                        className="p-4 bg-muted/50 rounded-lg border border-border"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-foreground">{tool.name}</h4>
                          {tool.url && (
                            <a 
                              href={tool.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{tool.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mark Complete Button */}
                <div className="pt-6 border-t border-border">
                  <Button
                    variant="success"
                    size="lg"
                    onClick={() => updateProjectStatus(selectedProject.id, 'completed')}
                    className="gap-2"
                  >
                    Mark as Completed
                    <CheckCircle2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-8">
                <div className="pt-6 border-t border-border flex gap-4">
                  {selectedProject.status === "not_started" && (
                    <Button
                      variant="hero"
                      size="lg"
                      onClick={startProject}
                      disabled={analyzingProject}
                      className="gap-2"
                    >
                      Start Project
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  )}
                  {selectedProject.status === "completed" && (
                    <Badge className="bg-success/10 text-success text-lg px-4 py-2">
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Completed
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Projects List */
          <>
            {projects.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <Code className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No projects assigned yet</h3>
                <p className="text-muted-foreground">
                  Projects will be assigned based on your selected career path.
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className="bg-card border border-border rounded-xl p-6 text-left hover:border-primary/50 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            project.status === "completed"
                              ? "bg-success"
                              : project.status === "in_progress"
                              ? "bg-gradient-hero"
                              : "bg-muted"
                          }`}
                        >
                          <Code
                            className={`w-6 h-6 ${
                              project.status === "not_started"
                                ? "text-muted-foreground"
                                : "text-primary-foreground"
                            }`}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {project.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {project.description}
                          </p>
                        </div>
                      </div>
                      {getStatusIcon(project.status)}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary" className={getDifficultyColor(project.difficulty)}>
                          {project.difficulty}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {project.skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {project.skills.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{project.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Continue Button */}
        {!selectedProject && (
          <div className="mt-8 flex justify-center">
            <Button
              variant="hero"
              size="lg"
              onClick={async () => {
                setUpdatingReadiness(true);
                try {
                  const { data, error } = await supabase.functions.invoke('update-job-readiness', {
                    body: {
                      resume_ready: false,
                      portfolio_ready: false,
                      confidence_level: 0
                    }
                  });
                  
                  if (error) {
                    console.error('Error updating job readiness:', error);
                    toast({
                      title: "Warning",
                      description: "Couldn't update job readiness data.",
                      variant: "destructive"
                    });
                  } else {
                    console.log('Job readiness updated:', data);
                  }
                } catch (err) {
                  console.error('Error calling update-job-readiness:', err);
                } finally {
                  setUpdatingReadiness(false);
                  navigate("/job-readiness");
                }
              }}
              disabled={updatingReadiness}
              className="gap-2"
            >
              {updatingReadiness ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  Continue to Job Readiness
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
