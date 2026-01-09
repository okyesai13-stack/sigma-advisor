import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  CheckCircle2,
  Clock,
  Loader2,
  Target,
  BookOpen,
  Code2,
  FileText,
  Briefcase,
  MessageSquare,
  Play,
  Lightbulb,
  Hammer,
  Sparkles
} from 'lucide-react';
import { AgentState, AgentStep } from './SigmaAgentController';
import SigmaAgentStepRenderer from './SigmaAgentStepRenderer';

interface AgentTimelineProps {
  agentState: AgentState;
  currentStep: AgentStep | null;
  executeStep: (stepId: string, userSelection?: any) => Promise<void>;
  isExecuting: boolean;
  canExecute: (stepId: string) => boolean;
}

const SigmaAgentTimeline: React.FC<AgentTimelineProps> = ({
  agentState,
  currentStep,
  executeStep,
  isExecuting,
  canExecute
}) => {
  const steps = [
    { id: 'career_analysis', title: 'Career Analysis', icon: Brain, stateKey: 'career_analysis_completed' },
    { id: 'skill_validation', title: 'Skill Validation', icon: Target, stateKey: 'skill_validation_completed' },
    { id: 'learning_plan', title: 'Learning Plan', icon: BookOpen, stateKey: 'learning_plan_completed' },
    { id: 'project_ideas', title: 'Project Ideas', icon: Lightbulb, stateKey: 'project_guidance_completed' },
    { id: 'project_plan', title: 'Project Plan', icon: Code2, stateKey: 'project_plan_completed' },
    { id: 'project_build', title: 'Project Build', icon: Hammer, stateKey: 'project_build_completed' },
    { id: 'resume_upgrade', title: 'Resume Upgrade', icon: FileText, stateKey: 'resume_completed' },
    { id: 'job_matching', title: 'Job Matching', icon: Briefcase, stateKey: 'job_matching_completed' },
    { id: 'interview_prep', title: 'Interview Prep', icon: MessageSquare, stateKey: 'interview_completed' },
  ];

  const getStepStatus = (stepId: string, stateKey: string) => {
    if (agentState[stateKey as keyof AgentState]) return 'completed';
    if (currentStep?.id === stepId) {
      if (isExecuting) return 'executing';
      return 'current';
    }
    return 'pending';
  };

  const allCompleted = steps.every(step => agentState[step.stateKey as keyof AgentState]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Sigma Career Agent</h2>
                <p className="text-sm text-muted-foreground">AI-powered career planning assistant</p>
              </div>
            </div>
            {!allCompleted && currentStep?.id === 'career_analysis' && currentStep.status === 'pending' && (
              <Button 
                onClick={() => executeStep('career_analysis')} 
                disabled={isExecuting}
                className="gap-2"
              >
                {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Execute
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id, step.stateKey);
          const Icon = step.icon;
          const isCurrent = currentStep?.id === step.id;

          return (
            <Card 
              key={step.id}
              className={`transition-all duration-300 ${
                status === 'completed' ? 'border-green-500/30 bg-green-50/50 dark:bg-green-950/20' :
                status === 'executing' ? 'border-primary/50 bg-primary/5' :
                isCurrent ? 'border-primary/30 bg-accent/30' :
                'border-border bg-card/50 opacity-60'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Step Number & Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    status === 'completed' ? 'bg-green-500 text-white' :
                    status === 'executing' ? 'bg-primary text-primary-foreground' :
                    isCurrent ? 'bg-primary/20 text-primary' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : status === 'executing' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>

                  {/* Step Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{step.title}</span>
                      <Badge variant={
                        status === 'completed' ? 'default' :
                        status === 'executing' ? 'secondary' :
                        isCurrent ? 'outline' : 'secondary'
                      } className="text-xs">
                        {status === 'completed' ? 'Done' :
                         status === 'executing' ? 'Running...' :
                         isCurrent ? 'Ready' : 'Pending'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Step {index + 1} of {steps.length}</p>
                  </div>

                  {/* Connection Line */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-9 top-14 w-0.5 h-3 bg-border" />
                  )}
                </div>

                {/* Step Content/Renderer */}
                {isCurrent && currentStep && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <SigmaAgentStepRenderer
                      step={currentStep}
                      executeStep={executeStep}
                      canExecute={canExecute}
                      isExecuting={isExecuting}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Completion Card */}
      {allCompleted && (
        <Card className="border-green-500/30 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-xl font-bold text-foreground mb-2">Journey Complete!</h3>
            <p className="text-muted-foreground">
              Congratulations! You've completed all career analysis steps with Sigma Agent.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SigmaAgentTimeline;
