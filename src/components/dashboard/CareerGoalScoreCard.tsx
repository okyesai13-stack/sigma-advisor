import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Target, TrendingUp, ChevronDown, Clock, Zap, BookOpen, Briefcase, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

interface ScoreBreakdownItem {
  score: number;
  label: string;
}

interface Recommendation {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  estimated_time: string;
  category: string;
}

interface WeekPlan {
  focus: string;
  tasks: string[];
}

interface PhasePlan {
  name: string;
  weeks: Record<string, WeekPlan>;
}

interface GoalScoreData {
  goal_score: number;
  score_breakdown: Record<string, ScoreBreakdownItem>;
  recommendations: Recommendation[];
  ninety_day_plan: {
    phase_1?: PhasePlan;
    phase_2?: PhasePlan;
    phase_3?: PhasePlan;
  };
  target_role: string;
}

interface CareerGoalScoreCardProps {
  data: GoalScoreData | null;
}

const getScoreColor = (score: number) => {
  if (score < 40) return { ring: 'text-red-500', bg: 'from-red-500/10 to-red-500/5', border: 'border-red-500/20' };
  if (score < 70) return { ring: 'text-amber-500', bg: 'from-amber-500/10 to-amber-500/5', border: 'border-amber-500/20' };
  return { ring: 'text-emerald-500', bg: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-500/20' };
};

const getImpactBadge = (impact: string) => {
  switch (impact) {
    case 'high': return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">High Impact</Badge>;
    case 'medium': return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Medium</Badge>;
    default: return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Low</Badge>;
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'portfolio': return <Briefcase className="w-4 h-4" />;
    case 'skills': return <Zap className="w-4 h-4" />;
    case 'education': return <GraduationCap className="w-4 h-4" />;
    case 'learning': return <BookOpen className="w-4 h-4" />;
    default: return <Target className="w-4 h-4" />;
  }
};

const CircularScore = ({ score }: { score: number }) => {
  const colors = getScoreColor(score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-36 h-36">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
        <motion.circle
          cx="60" cy="60" r="54" fill="none" strokeWidth="8" strokeLinecap="round"
          className={colors.ring}
          stroke="currentColor"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
};

const phaseColors = [
  { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', accent: 'text-emerald-600', dot: 'bg-emerald-500' },
  { bg: 'bg-amber-500/5', border: 'border-amber-500/20', accent: 'text-amber-600', dot: 'bg-amber-500' },
  { bg: 'bg-violet-500/5', border: 'border-violet-500/20', accent: 'text-violet-600', dot: 'bg-violet-500' },
];

const CareerGoalScoreCard = ({ data }: CareerGoalScoreCardProps) => {
  const [planOpen, setPlanOpen] = useState(false);
  const [checkedTasks, setCheckedTasks] = useState<Set<string>>(new Set());

  if (!data) return null;

  const colors = getScoreColor(data.goal_score);
  const breakdownEntries = Object.entries(data.score_breakdown || {});
  const phases = [data.ninety_day_plan?.phase_1, data.ninety_day_plan?.phase_2, data.ninety_day_plan?.phase_3].filter(Boolean) as PhasePlan[];

  const toggleTask = (key: string) => {
    setCheckedTasks(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <section className="mb-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* Score Hero */}
        <Card className={`bg-gradient-to-br ${colors.bg} ${colors.border} border overflow-hidden`}>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <CircularScore score={data.goal_score} />
              <div className="flex-1 text-center md:text-left">
                <p className="text-sm text-muted-foreground mb-1">Goal Readiness Score</p>
                <h2 className="text-xl font-bold mb-1">{data.target_role}</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {data.goal_score >= 70 ? "You're well-positioned to achieve this goal!" :
                   data.goal_score >= 40 ? "Good progress — follow the recommendations to boost your score." :
                   "Focus on the action plan below to build your readiness."}
                </p>
                {/* Breakdown bars */}
                <div className="space-y-2 max-w-md">
                  {breakdownEntries.map(([key, item]) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-28 text-right truncate">{item.label}</span>
                      <Progress value={item.score} className="h-2 flex-1" />
                      <span className="text-xs font-medium w-8">{item.score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        {data.recommendations?.length > 0 && (
          <div className="mt-4">
            <h3 className="text-base font-semibold flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              Score-Boosting Recommendations
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {data.recommendations.map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                >
                  <Card className="h-full">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5">
                          {getCategoryIcon(rec.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="text-sm font-semibold">{rec.title}</h4>
                            {getImpactBadge(rec.impact)}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{rec.description}</p>
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {rec.estimated_time}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* 90-Day Plan */}
        {phases.length > 0 && (
          <Collapsible open={planOpen} onOpenChange={setPlanOpen} className="mt-4">
            <CollapsibleTrigger className="w-full">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm">90-Day Action Plan</span>
                    <Badge variant="secondary" className="text-xs">12 Weeks</Badge>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${planOpen ? 'rotate-180' : ''}`} />
                </CardContent>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3 space-y-4">
                {phases.map((phase, phaseIdx) => {
                  const pc = phaseColors[phaseIdx];
                  const weeks = Object.entries(phase.weeks || {}).sort(([a], [b]) => {
                    const numA = parseInt(a.replace('week_', ''));
                    const numB = parseInt(b.replace('week_', ''));
                    return numA - numB;
                  });

                  return (
                    <Card key={phaseIdx} className={`${pc.bg} ${pc.border} border`}>
                      <CardHeader className="pb-2">
                        <CardTitle className={`text-sm flex items-center gap-2 ${pc.accent}`}>
                          <div className={`w-2.5 h-2.5 rounded-full ${pc.dot}`} />
                          Phase {phaseIdx + 1}: {phase.name}
                          <Badge variant="outline" className="text-xs ml-auto">
                            Weeks {phaseIdx * 4 + 1}-{(phaseIdx + 1) * 4}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {weeks.map(([weekKey, week]) => {
                          const weekNum = weekKey.replace('week_', '');
                          return (
                            <div key={weekKey} className="pl-4 border-l-2 border-muted">
                              <p className="text-xs font-semibold mb-1">Week {weekNum}: {week.focus}</p>
                              <div className="space-y-1">
                                {week.tasks?.map((task, tIdx) => {
                                  const taskKey = `${weekKey}_${tIdx}`;
                                  return (
                                    <label key={tIdx} className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                                      <Checkbox
                                        checked={checkedTasks.has(taskKey)}
                                        onCheckedChange={() => toggleTask(taskKey)}
                                        className="mt-0.5"
                                      />
                                      <span className={checkedTasks.has(taskKey) ? 'line-through opacity-60' : ''}>{task}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </motion.div>
    </section>
  );
};

export default CareerGoalScoreCard;
