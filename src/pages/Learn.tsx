import { useState } from "react";
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

interface Skill {
  id: string;
  name: string;
  progress: number;
  status: "not_started" | "in_progress" | "completed";
  resources: Resource[];
}

interface Resource {
  id: string;
  title: string;
  type: "course" | "article" | "video";
  duration: string;
  completed: boolean;
}

const Learn = () => {
  const navigate = useNavigate();
  const [skills, setSkills] = useState<Skill[]>([
    {
      id: "1",
      name: "JavaScript Fundamentals",
      progress: 65,
      status: "in_progress",
      resources: [
        { id: "1a", title: "JavaScript Basics", type: "course", duration: "4 hours", completed: true },
        { id: "1b", title: "ES6+ Features", type: "video", duration: "1.5 hours", completed: true },
        { id: "1c", title: "Async JavaScript", type: "article", duration: "30 min", completed: false },
        { id: "1d", title: "Advanced Patterns", type: "course", duration: "3 hours", completed: false },
      ],
    },
    {
      id: "2",
      name: "React Development",
      progress: 30,
      status: "in_progress",
      resources: [
        { id: "2a", title: "React Fundamentals", type: "course", duration: "5 hours", completed: true },
        { id: "2b", title: "Hooks Deep Dive", type: "video", duration: "2 hours", completed: false },
        { id: "2c", title: "State Management", type: "article", duration: "45 min", completed: false },
        { id: "2d", title: "Building Real Apps", type: "course", duration: "8 hours", completed: false },
      ],
    },
    {
      id: "3",
      name: "TypeScript",
      progress: 0,
      status: "not_started",
      resources: [
        { id: "3a", title: "TypeScript Basics", type: "course", duration: "3 hours", completed: false },
        { id: "3b", title: "Types & Interfaces", type: "video", duration: "1 hour", completed: false },
        { id: "3c", title: "Generics Guide", type: "article", duration: "20 min", completed: false },
      ],
    },
    {
      id: "4",
      name: "Node.js Backend",
      progress: 0,
      status: "not_started",
      resources: [
        { id: "4a", title: "Node.js Fundamentals", type: "course", duration: "4 hours", completed: false },
        { id: "4b", title: "Express.js", type: "video", duration: "2 hours", completed: false },
        { id: "4c", title: "API Design", type: "article", duration: "35 min", completed: false },
      ],
    },
  ]);

  const [expandedSkill, setExpandedSkill] = useState<string | null>("1");

  const toggleResource = (skillId: string, resourceId: string) => {
    setSkills(skills.map((skill) => {
      if (skill.id === skillId) {
        const updatedResources = skill.resources.map((r) =>
          r.id === resourceId ? { ...r, completed: !r.completed } : r
        );
        const completedCount = updatedResources.filter((r) => r.completed).length;
        const progress = Math.round((completedCount / updatedResources.length) * 100);
        return {
          ...skill,
          resources: updatedResources,
          progress,
          status: progress === 100 ? "completed" : progress > 0 ? "in_progress" : "not_started",
        } as Skill;
      }
      return skill;
    }));
  };

  const overallProgress = Math.round(
    skills.reduce((acc, skill) => acc + skill.progress, 0) / skills.length
  );

  const getTypeIcon = (type: Resource["type"]) => {
    switch (type) {
      case "course":
        return BookOpen;
      case "video":
        return Play;
      case "article":
        return ExternalLink;
    }
  };

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
                Complete these skills to become job-ready as a Full-Stack Developer
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
                        {skill.resources.filter((r) => r.completed).length}/{skill.resources.length} resources
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

              {/* Resources */}
              {expandedSkill === skill.id && (
                <div className="px-5 pb-5 space-y-3 border-t border-border pt-4">
                  {skill.resources.map((resource) => {
                    const TypeIcon = getTypeIcon(resource.type);
                    return (
                      <div
                        key={resource.id}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          resource.completed
                            ? "bg-success/5 border-success/20"
                            : "bg-muted/30 border-border hover:border-primary/30"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              resource.completed ? "bg-success/10" : "bg-muted"
                            }`}
                          >
                            <TypeIcon
                              className={`w-5 h-5 ${
                                resource.completed ? "text-success" : "text-muted-foreground"
                              }`}
                            />
                          </div>
                          <div>
                            <h4
                              className={`font-medium ${
                                resource.completed ? "text-muted-foreground line-through" : "text-foreground"
                              }`}
                            >
                              {resource.title}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {resource.duration}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant={resource.completed ? "outline" : "default"}
                          size="sm"
                          onClick={() => toggleResource(skill.id, resource.id)}
                        >
                          {resource.completed ? "Undo" : "Mark Complete"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

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
