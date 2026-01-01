import { useState } from "react";
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
} from "lucide-react";

interface Project {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  skills: string[];
  status: "not_started" | "in_progress" | "completed";
  estimatedTime: string;
  problem: string;
  outcome: string;
  deliverables: string[];
}

const Projects = () => {
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      title: "Personal Portfolio Website",
      description: "Build a responsive portfolio to showcase your work",
      difficulty: "beginner",
      skills: ["HTML/CSS", "JavaScript", "React"],
      status: "completed",
      estimatedTime: "8 hours",
      problem: "Create a professional online presence to attract potential employers",
      outcome: "A fully responsive portfolio website deployed and live",
      deliverables: [
        "Responsive design for all devices",
        "About section with bio",
        "Projects showcase grid",
        "Contact form",
        "Deployed to a live URL",
      ],
    },
    {
      id: "2",
      title: "Task Management App",
      description: "Full-stack CRUD application with authentication",
      difficulty: "intermediate",
      skills: ["React", "Node.js", "TypeScript", "PostgreSQL"],
      status: "in_progress",
      estimatedTime: "20 hours",
      problem: "Build a production-ready application demonstrating full-stack capabilities",
      outcome: "A functional task manager with user auth and data persistence",
      deliverables: [
        "User authentication system",
        "CRUD operations for tasks",
        "Task filtering and sorting",
        "Database integration",
        "REST API endpoints",
      ],
    },
    {
      id: "3",
      title: "E-commerce Platform",
      description: "Complex app with payment integration and admin panel",
      difficulty: "advanced",
      skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "Stripe"],
      status: "not_started",
      estimatedTime: "40 hours",
      problem: "Demonstrate ability to build production-grade commercial applications",
      outcome: "A fully functional e-commerce platform with payments",
      deliverables: [
        "Product catalog with search",
        "Shopping cart functionality",
        "Checkout with Stripe",
        "Admin dashboard",
        "Order management system",
      ],
    },
  ]);

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

  const startProject = (projectId: string) => {
    setProjects(
      projects.map((p) =>
        p.id === projectId && p.status === "not_started"
          ? { ...p, status: "in_progress" }
          : p
      )
    );
  };

  const completeProject = (projectId: string) => {
    setProjects(
      projects.map((p) =>
        p.id === projectId ? { ...p, status: "completed" } : p
      )
    );
    setSelectedProject(null);
  };

  const completedCount = projects.filter((p) => p.status === "completed").length;
  const overallProgress = Math.round((completedCount / projects.length) * 100);

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
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {selectedProject.estimatedTime}
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

            <div className="p-8 space-y-8">
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Problem
                </h3>
                <p className="text-muted-foreground">{selectedProject.problem}</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  Expected Outcome
                </h3>
                <p className="text-muted-foreground">{selectedProject.outcome}</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  Deliverables
                </h3>
                <ul className="space-y-2">
                  {selectedProject.deliverables.map((item, index) => (
                    <li key={index} className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 border-t border-border flex gap-4">
                {selectedProject.status === "not_started" && (
                  <Button
                    variant="hero"
                    size="lg"
                    onClick={() => startProject(selectedProject.id)}
                    className="gap-2"
                  >
                    Start Project
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                )}
                {selectedProject.status === "in_progress" && (
                  <Button
                    variant="success"
                    size="lg"
                    onClick={() => completeProject(selectedProject.id)}
                    className="gap-2"
                  >
                    Mark as Completed
                    <CheckCircle2 className="w-5 h-5" />
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
          </div>
        ) : (
          /* Projects List */
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
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {project.estimatedTime}
                    </div>
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

        {/* Continue Button */}
        {!selectedProject && (
          <div className="mt-8 flex justify-center">
            <Button
              variant="hero"
              size="lg"
              onClick={() => navigate("/job-readiness")}
              className="gap-2"
            >
              Continue to Job Readiness
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
