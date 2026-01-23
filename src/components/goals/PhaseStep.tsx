import { ReactNode } from 'react';
import { CheckCircle2, Lock, Play, Circle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface PhaseStepProps {
  stepNumber: number;
  title: string;
  description: string;
  icon: ReactNode;
  status: 'locked' | 'active' | 'completed' | 'pending';
  timeRange?: string;
  isExpanded: boolean;
  onToggle: () => void;
  progress: number;
  children: ReactNode;
  isLast?: boolean;
}

export function PhaseStep({
  stepNumber,
  title,
  description,
  icon,
  status,
  timeRange,
  isExpanded,
  onToggle,
  progress,
  children,
  isLast = false,
}: PhaseStepProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'active':
        return <Play className="h-4 w-4 text-primary fill-primary" />;
      case 'locked':
        return <Lock className="h-3 w-3 text-muted-foreground" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className={cn('relative', !isLast && 'pb-3')}>
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-border" />
      )}

      {/* Step indicator */}
      <div className="absolute left-0 top-3 z-10">
        <div className={cn(
          'h-8 w-8 rounded-full flex items-center justify-center border-2 bg-background transition-all',
          status === 'completed' && 'border-emerald-500 bg-emerald-500/10',
          status === 'active' && 'border-primary bg-primary/10 ring-2 ring-primary/20',
          status === 'pending' && 'border-border bg-muted',
          status === 'locked' && 'border-border bg-muted opacity-50'
        )}>
          {getStatusIcon()}
        </div>
      </div>

      {/* Step Card */}
      <Collapsible open={isExpanded && status !== 'locked'} onOpenChange={onToggle}>
        <Card className={cn(
          'ml-12 transition-all duration-200',
          status === 'active' && 'border-primary/30 shadow-sm',
          status === 'locked' && 'opacity-50'
        )}>
          <CollapsibleTrigger asChild disabled={status === 'locked'}>
            <div className={cn(
              'p-3 cursor-pointer select-none',
              status !== 'locked' && 'hover:bg-muted/30'
            )}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                    status === 'completed' && 'bg-emerald-500/10 text-emerald-600',
                    status === 'active' && 'bg-primary/10 text-primary',
                    (status === 'pending' || status === 'locked') && 'bg-muted text-muted-foreground'
                  )}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground font-medium">
                        Step {stepNumber}
                      </span>
                      {timeRange && (
                        <span className="text-xs text-muted-foreground">• {timeRange}</span>
                      )}
                      <Badge 
                        variant={status === 'completed' ? 'default' : status === 'active' ? 'default' : 'secondary'}
                        className={cn(
                          'text-[10px] px-1.5 py-0',
                          status === 'completed' && 'bg-emerald-500/10 text-emerald-600'
                        )}
                      >
                        {status === 'completed' ? 'Done' : 
                         status === 'active' ? 'Active' : 
                         status === 'locked' ? 'Locked' : 'Pending'}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-foreground text-sm mt-1">{title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
                    
                    {status !== 'locked' && progress > 0 && (
                      <div className="mt-2">
                        <Progress value={progress} className="h-1" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-3 pb-3 pt-0 border-t border-border">
              <div className="pt-3">
                {children}
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
