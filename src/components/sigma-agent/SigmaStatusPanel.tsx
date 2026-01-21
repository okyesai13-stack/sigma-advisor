import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  CheckCircle2, 
  Loader2, 
  Zap,
  Brain,
  Target,
  BookOpen,
  Lightbulb,
  Briefcase
} from 'lucide-react';
import { AgentStep } from './SigmaAgentController';

interface SigmaStatusPanelProps {
  currentStep: AgentStep | null;
  isExecuting: boolean;
  statusMessage: string;
  allCompleted: boolean;
}

const SigmaStatusPanel: React.FC<SigmaStatusPanelProps> = ({
  currentStep,
  isExecuting,
  statusMessage,
  allCompleted
}) => {
  const getStepIcon = (stepId: string) => {
    switch (stepId) {
      case 'career_analysis': return Brain;
      case 'skill_validation': return Target;
      case 'learning_plan': return BookOpen;
      case 'project_ideas': return Lightbulb;
      case 'job_matching': return Briefcase;
      default: return Zap;
    }
  };

  const StepIcon = currentStep ? getStepIcon(currentStep.id) : Zap;

  return (
    <Card className="h-full border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          AI Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className={`p-4 rounded-xl ${
          allCompleted 
            ? 'bg-green-500/10 border border-green-500/20' 
            : isExecuting 
              ? 'bg-primary/10 border border-primary/20' 
              : 'bg-muted/50'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            {allCompleted ? (
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
            ) : isExecuting ? (
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <StepIcon className="w-5 h-5 text-primary" />
              </div>
            )}
            <div>
              <Badge variant={allCompleted ? 'default' : isExecuting ? 'secondary' : 'outline'} className="text-xs">
                {allCompleted ? 'Complete' : isExecuting ? 'Processing' : 'Ready'}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {statusMessage}
          </p>
        </div>

        {/* Current Step */}
        {currentStep && currentStep.id !== 'entry_gate' && !allCompleted && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Current Step
            </h4>
            <div className="flex items-center gap-2">
              <StepIcon className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {currentStep.name}
              </span>
            </div>
          </div>
        )}

        {/* Agent Info */}
        <div className="pt-4 border-t border-border/50">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            About Sigma
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Sigma is an autonomous AI agent that analyzes your profile and guides you through career development. 
            Each step auto-triggers after completion.
          </p>
        </div>

        {/* What's happening */}
        {isExecuting && currentStep && (
          <div className="pt-4 border-t border-border/50">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              What's Happening
            </h4>
            <div className="space-y-2">
              {currentStep.id === 'career_analysis' && (
                <>
                  <StatusLine text="Reading your resume" />
                  <StatusLine text="Analyzing skills and experience" />
                  <StatusLine text="Identifying career paths" active />
                </>
              )}
              {currentStep.id === 'skill_validation' && (
                <>
                  <StatusLine text="Comparing skills to goal" />
                  <StatusLine text="Finding gaps" active />
                </>
              )}
              {currentStep.id === 'learning_plan' && (
                <>
                  <StatusLine text="Prioritizing missing skills" />
                  <StatusLine text="Creating roadmap" active />
                </>
              )}
              {currentStep.id === 'project_ideas' && (
                <>
                  <StatusLine text="Matching skills to projects" />
                  <StatusLine text="Generating recommendations" active />
                </>
              )}
              {currentStep.id === 'job_matching' && (
                <>
                  <StatusLine text="Analyzing readiness" />
                  <StatusLine text="Finding matching jobs" active />
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const StatusLine: React.FC<{ text: string; active?: boolean }> = ({ text, active }) => (
  <div className="flex items-center gap-2">
    {active ? (
      <Loader2 className="w-3 h-3 text-primary animate-spin" />
    ) : (
      <CheckCircle2 className="w-3 h-3 text-green-500" />
    )}
    <span className={`text-xs ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
      {text}
    </span>
  </div>
);

export default SigmaStatusPanel;
