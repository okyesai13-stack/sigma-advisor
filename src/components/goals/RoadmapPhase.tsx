import { ReactNode } from 'react';
import { ChevronDown, Lock, CheckCircle2, Play } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface RoadmapPhaseProps {
  phaseNumber: number;
  title: string;
  description: string;
  icon: ReactNode;
  status: 'locked' | 'active' | 'completed';
  timeRange: string;
  isExpanded: boolean;
  onToggle: () => void;
  progress: number;
  children: ReactNode;
  isLast?: boolean;
}

export function RoadmapPhase({
  phaseNumber,
  title,
  description,
  icon,
  status,
  timeRange,
  isExpanded,
  onToggle,
  progress,
  children,
  isLast = false
}: RoadmapPhaseProps) {
  const statusColors = {
    locked: 'bg-muted text-muted-foreground border-border',
    active: 'bg-primary/10 text-primary border-primary/30',
    completed: 'bg-success/10 text-success border-success/30'
  };

  const statusBadge = {
    locked: { label: 'Locked', variant: 'secondary' as const },
    active: { label: 'Active', variant: 'default' as const },
    completed: { label: 'Completed', variant: 'default' as const }
  };

  const iconColors = {
    locked: 'bg-muted text-muted-foreground',
    active: 'bg-primary text-primary-foreground',
    completed: 'bg-success text-success-foreground'
  };

  return (
    <div className={cn('relative', !isLast && 'pb-4')}>
      {/* Timeline dot */}
      <div className="absolute left-0 md:left-6 top-6 -translate-x-1/2 z-10">
        <div className={cn(
          'h-12 w-12 rounded-full flex items-center justify-center border-4 border-background transition-all duration-300',
          iconColors[status],
          status === 'active' && 'ring-4 ring-primary/20'
        )}>
          {status === 'completed' ? (
            <CheckCircle2 className="h-6 w-6" />
          ) : status === 'locked' ? (
            <Lock className="h-5 w-5" />
          ) : (
            icon
          )}
        </div>
      </div>

      {/* Phase Card */}
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <Card className={cn(
          'ml-8 md:ml-16 transition-all duration-300',
          status === 'active' && 'ring-2 ring-primary/20 shadow-lg',
          status === 'locked' && 'opacity-60'
        )}>
          <CollapsibleTrigger asChild disabled={status === 'locked'}>
            <div className={cn(
              'p-4 md:p-6 cursor-pointer select-none',
              status !== 'locked' && 'hover:bg-muted/30'
            )}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-medium text-muted-foreground">
                      PHASE {phaseNumber}
                    </span>
                    <Badge 
                      variant={statusBadge[status].variant}
                      className={cn(
                        'text-xs',
                        status === 'completed' && 'bg-success text-success-foreground'
                      )}
                    >
                      {statusBadge[status].label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {timeRange}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {description}
                  </p>
                  
                  {/* Progress bar for active/completed phases */}
                  {status !== 'locked' && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-foreground">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>
                  )}
                </div>
                
                {status !== 'locked' && (
                  <ChevronDown className={cn(
                    'h-5 w-5 text-muted-foreground transition-transform shrink-0',
                    isExpanded && 'rotate-180'
                  )} />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="px-4 md:px-6 pb-4 md:pb-6 pt-0 border-t border-border">
              <div className="pt-4">
                {children}
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
