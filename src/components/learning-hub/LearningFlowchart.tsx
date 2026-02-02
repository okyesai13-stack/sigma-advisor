import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GitBranch, CheckCircle2, Circle, Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { LearningStep } from '@/hooks/useLearningContent';

interface LearningFlowchartProps {
  skillName: string;
  onStepComplete: (step: number) => void;
  completedSteps: number[];
  savedData?: LearningStep[] | null;
  onDataGenerated?: (data: LearningStep[]) => void;
}

const LearningFlowchart = ({ 
  skillName, 
  onStepComplete, 
  completedSteps, 
  savedData, 
  onDataGenerated 
}: LearningFlowchartProps) => {
  const { toast } = useToast();
  const [steps, setSteps] = useState<LearningStep[]>(savedData || []);
  const [isLoading, setIsLoading] = useState(!savedData || savedData.length === 0);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (savedData && savedData.length > 0) {
      setSteps(savedData);
      setIsLoading(false);
    } else {
      generateFlowchart();
    }
  }, [skillName]);

  useEffect(() => {
    // Set current step based on completed steps
    const maxCompleted = Math.max(...completedSteps, -1);
    setCurrentStep(maxCompleted + 1);
  }, [completedSteps]);

  const generateFlowchart = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('learning-flowchart', {
        body: { skill_name: skillName }
      });

      if (error) throw error;

      if (data?.steps && Array.isArray(data.steps)) {
        setSteps(data.steps);
        onDataGenerated?.(data.steps);
      } else {
        // Fallback steps
        const fallbackSteps: LearningStep[] = [
          {
            id: 0,
            title: 'Foundation',
            description: `Understand the core concepts and fundamentals of ${skillName}`,
            duration: '1-2 weeks',
            resources: ['Documentation', 'Beginner tutorials']
          },
          {
            id: 1,
            title: 'Basic Implementation',
            description: 'Apply basic concepts through simple exercises and examples',
            duration: '1-2 weeks',
            resources: ['Practice exercises', 'Code examples']
          },
          {
            id: 2,
            title: 'Intermediate Concepts',
            description: 'Learn common patterns, best practices, and intermediate techniques',
            duration: '2-3 weeks',
            resources: ['In-depth courses', 'Pattern guides']
          },
          {
            id: 3,
            title: 'Project Work',
            description: 'Build a real project to solidify your understanding',
            duration: '2-4 weeks',
            resources: ['Project templates', 'Code reviews']
          },
          {
            id: 4,
            title: 'Advanced & Mastery',
            description: 'Explore advanced topics and optimize your skills',
            duration: 'Ongoing',
            resources: ['Advanced tutorials', 'Community forums']
          }
        ];
        setSteps(fallbackSteps);
        onDataGenerated?.(fallbackSteps);
      }
    } catch (error) {
      console.error('Error generating flowchart:', error);
      // Set fallback
      const fallbackSteps: LearningStep[] = [
        { id: 0, title: 'Learn Basics', description: 'Start with fundamentals', duration: '1 week' },
        { id: 1, title: 'Practice', description: 'Hands-on exercises', duration: '2 weeks' },
        { id: 2, title: 'Build Projects', description: 'Apply your knowledge', duration: '3 weeks' },
        { id: 3, title: 'Advanced Topics', description: 'Deep dive into complex concepts', duration: '2 weeks' },
        { id: 4, title: 'Mastery', description: 'Continuous improvement', duration: 'Ongoing' }
      ];
      setSteps(fallbackSteps);
      onDataGenerated?.(fallbackSteps);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepComplete = (stepId: number) => {
    onStepComplete(stepId);
    toast({
      title: "Step Completed!",
      description: `You've completed: ${steps.find(s => s.id === stepId)?.title}`,
    });
  };

  const progressPercentage = steps.length > 0 ? (completedSteps.length / steps.length) * 100 : 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Generating learning path for {skillName}...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <GitBranch className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Learning Path Progress</h3>
                <p className="text-muted-foreground">
                  {completedSteps.length} of {steps.length} steps completed
                </p>
              </div>
            </div>
            <div className="w-full md:w-48">
              <Progress value={progressPercentage} className="h-3" />
              <p className="text-sm text-muted-foreground text-center mt-1">
                {Math.round(progressPercentage)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flowchart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-primary" />
            Step-by-Step Learning Path
          </CardTitle>
          <Button variant="outline" size="sm" onClick={generateFlowchart}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Regenerate
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = step.id === currentStep;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {/* Connector Line */}
                  {index > 0 && (
                    <div className="flex justify-center py-2">
                      <div className={`w-0.5 h-8 ${
                        completedSteps.includes(steps[index - 1].id) 
                          ? 'bg-primary' 
                          : 'bg-border'
                      }`} />
                    </div>
                  )}

                  {/* Step Card */}
                  <div className={`
                    relative p-6 rounded-xl border-2 transition-all
                    ${isCompleted 
                      ? 'bg-primary/5 border-primary' 
                      : isCurrent 
                        ? 'bg-amber-500/5 border-amber-500 ring-2 ring-amber-500/20' 
                        : 'bg-muted/30 border-border opacity-70'
                    }
                  `}>
                    <div className="flex items-start gap-4">
                      {/* Step Number/Status */}
                      <div className={`
                        flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
                        ${isCompleted 
                          ? 'bg-primary text-primary-foreground' 
                          : isCurrent 
                            ? 'bg-amber-500 text-white' 
                            : 'bg-muted text-muted-foreground'
                        }
                      `}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <span className="text-lg font-bold">{step.id + 1}</span>
                        )}
                      </div>

                      {/* Step Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold">{step.title}</h3>
                          {isCompleted && (
                            <Badge className="bg-green-500/20 text-green-600">Completed</Badge>
                          )}
                          {isCurrent && !isCompleted && (
                            <Badge className="bg-amber-500/20 text-amber-600">Current</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground mb-2">{step.description}</p>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline">{step.duration}</Badge>
                          {step.resources && (
                            <div className="flex gap-1">
                              {step.resources.slice(0, 2).map((r, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {r}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <Button variant="outline" size="sm" disabled>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Done
                          </Button>
                        ) : isCurrent ? (
                          <Button size="sm" onClick={() => handleStepComplete(step.id)}>
                            Mark Complete
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" disabled>
                            <Circle className="w-4 h-4 mr-2" />
                            Locked
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Completion Message */}
            {completedSteps.length === steps.length && steps.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 p-6 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500 text-center"
              >
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-green-600">Congratulations!</h3>
                <p className="text-muted-foreground">
                  You've completed the learning path for {skillName}!
                </p>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LearningFlowchart;