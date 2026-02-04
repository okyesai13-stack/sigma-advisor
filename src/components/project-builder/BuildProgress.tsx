import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CheckCircle2, 
  Circle, 
  Trophy, 
  Sparkles, 
  Rocket, 
  Code2, 
  Star,
  PartyPopper
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import confetti from 'canvas-confetti';

interface BuildProgressProps {
  steps: string[];
  completedSteps: number[];
  onToggleStep: (stepIndex: number) => void;
  projectTitle: string;
}

const achievements = [
  { id: 'started', name: 'Project Started', icon: Rocket, threshold: 1, color: 'text-blue-500' },
  { id: 'quarter', name: 'Making Progress', icon: Star, threshold: 0.25, color: 'text-amber-500' },
  { id: 'halfway', name: 'Halfway There!', icon: Code2, threshold: 0.5, color: 'text-purple-500' },
  { id: 'almost', name: 'Almost Done', icon: Sparkles, threshold: 0.75, color: 'text-emerald-500' },
  { id: 'complete', name: 'Project Complete!', icon: Trophy, threshold: 1, color: 'text-yellow-500' },
];

const BuildProgress = ({ steps, completedSteps, onToggleStep, projectTitle }: BuildProgressProps) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastAchievement, setLastAchievement] = useState<string | null>(null);

  const progressPercentage = steps.length > 0 ? (completedSteps.length / steps.length) * 100 : 0;
  const isComplete = completedSteps.length === steps.length && steps.length > 0;

  useEffect(() => {
    // Check for new achievements
    const ratio = steps.length > 0 ? completedSteps.length / steps.length : 0;
    
    if (completedSteps.length === 1 && !lastAchievement) {
      triggerAchievement('started');
    } else if (ratio >= 1 && lastAchievement !== 'complete') {
      triggerAchievement('complete');
      triggerConfetti();
    } else if (ratio >= 0.75 && lastAchievement !== 'almost' && lastAchievement !== 'complete') {
      triggerAchievement('almost');
    } else if (ratio >= 0.5 && !['halfway', 'almost', 'complete'].includes(lastAchievement || '')) {
      triggerAchievement('halfway');
      triggerConfetti();
    } else if (ratio >= 0.25 && !['quarter', 'halfway', 'almost', 'complete'].includes(lastAchievement || '')) {
      triggerAchievement('quarter');
    }
  }, [completedSteps.length, steps.length]);

  const triggerAchievement = (id: string) => {
    setLastAchievement(id);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const earnedAchievements = achievements.filter(a => {
    const ratio = steps.length > 0 ? completedSteps.length / steps.length : 0;
    if (a.id === 'started') return completedSteps.length >= 1;
    return ratio >= a.threshold;
  });

  return (
    <div className="space-y-4">
      {/* Progress Overview Card */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Rocket className="w-4 h-4 text-primary-foreground" />
              </div>
              Build Progress
            </CardTitle>
            <Badge 
              variant="outline" 
              className={`${isComplete ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-primary/10'}`}
            >
              {completedSteps.length}/{steps.length} Steps
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress Ring */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  className="text-muted"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="transparent"
                  r="28"
                  cx="32"
                  cy="32"
                />
                <motion.circle
                  className="text-primary"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="transparent"
                  r="28"
                  cx="32"
                  cy="32"
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 176 }}
                  animate={{ strokeDashoffset: 176 - (176 * progressPercentage) / 100 }}
                  style={{ strokeDasharray: 176 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold">{Math.round(progressPercentage)}%</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{projectTitle}</p>
              <p className="text-xs text-muted-foreground">
                {isComplete ? '🎉 Congratulations!' : `${steps.length - completedSteps.length} steps remaining`}
              </p>
              <Progress value={progressPercentage} className="h-1.5 mt-2" />
            </div>
          </div>

          {/* Achievements */}
          <div className="flex gap-2 flex-wrap">
            {achievements.map((achievement) => {
              const earned = earnedAchievements.some(e => e.id === achievement.id);
              const Icon = achievement.icon;
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ 
                    scale: earned ? 1 : 0.8, 
                    opacity: earned ? 1 : 0.3 
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                    earned ? 'bg-primary/10' : 'bg-muted'
                  }`}
                  title={achievement.name}
                >
                  <Icon className={`w-3 h-3 ${earned ? achievement.color : 'text-muted-foreground'}`} />
                  <span className={earned ? '' : 'text-muted-foreground'}>{achievement.name}</span>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Steps Checklist */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Setup Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.includes(index);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex gap-3 p-3 rounded-lg transition-colors cursor-pointer hover:bg-muted/50 ${
                    isCompleted ? 'bg-emerald-500/5' : 'bg-muted/30'
                  }`}
                  onClick={() => onToggleStep(index)}
                >
                  <div className="pt-0.5">
                    <Checkbox 
                      checked={isCompleted}
                      onCheckedChange={() => onToggleStep(index)}
                      className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        isCompleted 
                          ? 'bg-emerald-500/10 text-emerald-600' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        Step {index + 1}
                      </span>
                      {isCompleted && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                    <div className={`text-sm prose prose-sm dark:prose-invert max-w-none [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs ${
                      isCompleted ? 'line-through text-muted-foreground' : ''
                    }`}>
                      <ReactMarkdown>{step}</ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Achievement Popup */}
      <AnimatePresence>
        {showCelebration && lastAchievement && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
          >
            <Card className="bg-gradient-to-r from-primary/10 to-primary/20 border-primary/30 shadow-xl">
              <CardContent className="py-4 px-6 flex items-center gap-3">
                <PartyPopper className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-bold text-sm">Achievement Unlocked!</p>
                  <p className="text-xs text-muted-foreground">
                    {achievements.find(a => a.id === lastAchievement)?.name}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BuildProgress;
