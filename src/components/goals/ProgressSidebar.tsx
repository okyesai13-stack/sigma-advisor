import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Flame, 
  Target, 
  BookOpen, 
  FolderKanban, 
  Send,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface ProgressSidebarProps {
  skillsRemaining: number;
  skillsTotal: number;
  projectsCompleted: number;
  projectsTotal: number;
  applicationsCount: number;
  learningStreak: number;
}

export function ProgressSidebar({
  skillsRemaining,
  skillsTotal,
  projectsCompleted,
  projectsTotal,
  applicationsCount,
  learningStreak
}: ProgressSidebarProps) {
  const skillsCompleted = skillsTotal - skillsRemaining;
  const skillsProgress = skillsTotal > 0 ? Math.round((skillsCompleted / skillsTotal) * 100) : 0;
  const projectsProgress = projectsTotal > 0 ? Math.round((projectsCompleted / projectsTotal) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* AI Progress Monitor */}
      <Card className="p-5 bg-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">AI Progress Monitor</h3>
        </div>

        <div className="space-y-4">
          {/* Skills Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Skills</span>
              </div>
              <span className="font-medium text-foreground">
                {skillsCompleted}/{skillsTotal}
              </span>
            </div>
            <Progress value={skillsProgress} className="h-2" />
            {skillsRemaining > 0 && (
              <p className="text-xs text-muted-foreground">
                {skillsRemaining} skill{skillsRemaining !== 1 ? 's' : ''} remaining
              </p>
            )}
          </div>

          {/* Projects Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Projects</span>
              </div>
              <span className="font-medium text-foreground">
                {projectsCompleted}/{projectsTotal}
              </span>
            </div>
            <Progress value={projectsProgress} className="h-2" />
          </div>

          {/* Applications Sent */}
          <div className="flex items-center justify-between py-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Applications</span>
            </div>
            <span className="text-sm font-medium text-foreground">
              {applicationsCount}
            </span>
          </div>
        </div>
      </Card>

      {/* Streak Tracker */}
      <Card className="p-5 bg-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
            <Flame className="h-4 w-4 text-warning" />
          </div>
          <h3 className="font-semibold text-foreground">Streak Tracker</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">Learning Streak</span>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="h-4 w-4 text-warning" />
              <span className="font-semibold text-foreground">{learningStreak}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-success" />
              <span className="text-sm text-foreground">Execution Streak</span>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="h-4 w-4 text-warning" />
              <span className="font-semibold text-foreground">{projectsCompleted}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Reality Check Engine */}
      <Card className="p-5 bg-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-accent-foreground" />
          </div>
          <h3 className="font-semibold text-foreground">Reality Check</h3>
        </div>

        <div className="space-y-3">
          {skillsRemaining === 0 && projectsTotal > 0 ? (
            <div className="flex items-start gap-2 p-3 bg-success/10 rounded-lg border border-success/20">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
              <p className="text-sm text-success">
                All skills validated! Great progress.
              </p>
            </div>
          ) : skillsRemaining > 3 ? (
            <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg border border-warning/20">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <p className="text-sm text-warning">
                Focus on core skills first. {skillsRemaining} skills need attention.
              </p>
            </div>
          ) : projectsCompleted === 0 && projectsTotal > 0 ? (
            <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-primary">
                Start your first project to build credibility.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                No issues detected. Keep going!
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
