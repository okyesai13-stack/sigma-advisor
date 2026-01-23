import { ReactNode, useState } from 'react';
import { ChevronDown, Lock, CheckCircle2, Clock, TrendingUp, Target, Briefcase, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CareerRole {
  id?: string;
  role: string;
  term?: 'short' | 'mid' | 'long';
  term_label?: string;
  domain?: string;
  match_score?: number;
  rationale?: string;
  required_skills?: string[];
  skills_to_develop?: string[];
  alignment_to_goal?: string;
}

interface TermSectionProps {
  term: 'short' | 'mid' | 'long';
  role: CareerRole | null;
  status: 'locked' | 'active' | 'completed';
  isExpanded: boolean;
  onToggle: () => void;
  progress: number;
  children: ReactNode;
  unlockMessage?: string;
}

const termConfig = {
  short: {
    label: 'Short-term Goal',
    timeline: '0-1 Year',
    icon: Clock,
    color: 'emerald',
    bgClass: 'from-emerald-500/10 to-emerald-500/5',
    borderClass: 'border-emerald-500/30',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  },
  mid: {
    label: 'Mid-term Goal',
    timeline: '1-3 Years',
    icon: TrendingUp,
    color: 'amber',
    bgClass: 'from-amber-500/10 to-amber-500/5',
    borderClass: 'border-amber-500/30',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600',
    badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  },
  long: {
    label: 'Long-term Goal',
    timeline: '3-5 Years',
    icon: Target,
    color: 'violet',
    bgClass: 'from-violet-500/10 to-violet-500/5',
    borderClass: 'border-violet-500/30',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-600',
    badgeClass: 'bg-violet-500/10 text-violet-600 border-violet-500/30',
  },
};

export function TermSection({
  term,
  role,
  status,
  isExpanded,
  onToggle,
  progress,
  children,
  unlockMessage,
}: TermSectionProps) {
  const config = termConfig[term];
  const Icon = config.icon;

  return (
    <div className="relative">
      <Collapsible open={isExpanded && status !== 'locked'} onOpenChange={onToggle}>
        <Card className={cn(
          'overflow-hidden transition-all duration-300',
          status === 'active' && 'ring-2 ring-primary/20 shadow-lg',
          status === 'locked' && 'opacity-60',
          status === 'completed' && 'ring-1 ring-emerald-500/30'
        )}>
          {/* Term Header with Role */}
          <CollapsibleTrigger asChild disabled={status === 'locked'}>
            <div className={cn(
              'p-5 cursor-pointer select-none bg-gradient-to-r',
              config.bgClass,
              status !== 'locked' && 'hover:bg-opacity-80'
            )}>
              <div className="flex items-start gap-4">
                {/* Term Icon */}
                <div className={cn(
                  'h-14 w-14 rounded-xl flex items-center justify-center shrink-0 transition-all',
                  status === 'completed' ? 'bg-emerald-500/20' : config.iconBg,
                  status === 'active' && 'ring-4 ring-primary/10'
                )}>
                  {status === 'completed' ? (
                    <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                  ) : status === 'locked' ? (
                    <Lock className="h-6 w-6 text-muted-foreground" />
                  ) : (
                    <Icon className={cn('h-7 w-7', config.iconColor)} />
                  )}
                </div>

                {/* Term Info & Role */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge className={cn('text-xs font-medium', config.badgeClass)}>
                      {config.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{config.timeline}</span>
                    {status === 'completed' && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 text-xs">
                        ✓ Achieved
                      </Badge>
                    )}
                    {status === 'active' && (
                      <Badge variant="default" className="text-xs">
                        Active
                      </Badge>
                    )}
                  </div>

                  {/* Role Display */}
                  {role ? (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-lg font-bold text-foreground">
                          {role.role}
                        </h3>
                        {role.match_score && (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {role.match_score}%
                          </Badge>
                        )}
                      </div>
                      {role.domain && (
                        <p className="text-sm text-muted-foreground mb-1">{role.domain}</p>
                      )}
                      {role.rationale && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {role.rationale}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-lg font-semibold text-muted-foreground">
                        {status === 'locked' ? 'Locked' : 'Role pending...'}
                      </h3>
                      {unlockMessage && status === 'locked' && (
                        <p className="text-sm text-muted-foreground mt-1">{unlockMessage}</p>
                      )}
                    </div>
                  )}

                  {/* Progress bar */}
                  {status !== 'locked' && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progress to {role?.role || 'Goal'}</span>
                        <span className="font-medium text-foreground">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                </div>

                {/* Expand/Collapse */}
                {status !== 'locked' && (
                  <ChevronDown className={cn(
                    'h-5 w-5 text-muted-foreground transition-transform shrink-0 mt-2',
                    isExpanded && 'rotate-180'
                  )} />
                )}
              </div>
            </div>
          </CollapsibleTrigger>

          {/* Collapsible Content with Phases */}
          <CollapsibleContent>
            <div className="border-t border-border bg-background/50">
              <div className="p-4 md:p-6">
                {children}
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
