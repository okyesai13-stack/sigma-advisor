import { Badge } from "@/components/ui/badge";
import { FolderKanban, ExternalLink } from "lucide-react";

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    description: string | null;
    domain: string | null;
    status: string | null;
  };
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "in progress":
      case "in_progress":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="bg-muted/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-border/50 hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <FolderKanban className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-foreground text-sm sm:text-base truncate">
              {project.title || "Untitled Project"}
            </h4>
            <Badge
              variant="outline"
              className={`text-[10px] sm:text-xs shrink-0 ${getStatusColor(project.status)}`}
            >
              {project.status || "Not Started"}
            </Badge>
          </div>
          {project.description && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
              {project.description}
            </p>
          )}
          {project.domain && (
            <div className="mt-2">
              <Badge variant="secondary" className="text-[10px] sm:text-xs">
                {project.domain}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
