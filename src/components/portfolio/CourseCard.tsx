import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle2, Clock, Play } from "lucide-react";

interface CourseCardProps {
  course: {
    id: string;
    skill_name: string;
    career_title: string;
    status: string | null;
    learning_steps: any[] | null;
    steps_completed: boolean[] | null;
  };
}

export default function CourseCard({ course }: CourseCardProps) {
  const getStatusIcon = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />;
      case "in_progress":
      case "in progress":
        return <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />;
      default:
        return <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "in_progress":
      case "in progress":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  // Calculate progress
  const stepsCompleted = course.steps_completed?.filter(Boolean).length || 0;
  const totalSteps = course.learning_steps?.length || course.steps_completed?.length || 0;
  const progressPercent = totalSteps > 0 ? Math.round((stepsCompleted / totalSteps) * 100) : 0;

  return (
    <div className="bg-muted/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-border/50 hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-accent/50 flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-accent-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-foreground text-sm sm:text-base truncate">
              {course.skill_name}
            </h4>
            <div className="flex items-center gap-1.5 shrink-0">
              {getStatusIcon(course.status)}
              <Badge
                variant="outline"
                className={`text-[10px] sm:text-xs ${getStatusColor(course.status)}`}
              >
                {course.status?.replace("_", " ") || "Not Started"}
              </Badge>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            For: {course.career_title}
          </p>
          
          {/* Progress bar */}
          {totalSteps > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground mb-1">
                <span>{stepsCompleted} of {totalSteps} steps</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
