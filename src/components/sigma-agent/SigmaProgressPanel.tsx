import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';
import { AgentState, AgentStep } from './SigmaAgentController';

interface ProgressStep {
  id: string;
  title: string;
  icon: React.ElementType;
  stateKey: string;
}

interface SigmaProgressPanelProps {
  steps: ProgressStep[];
  agentState: AgentState;
  currentStep: AgentStep | null;
  isExecuting: boolean;
  getStepStatus: (stepId: string, stateKey: string) => string;
}

const SigmaProgressPanel: React.FC<SigmaProgressPanelProps> = ({
  steps,
  agentState,
  currentStep,
  isExecuting,
  getStepStatus
}) => {
  return (
    <Card className="h-full border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id, step.stateKey);
          const Icon = step.icon;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="relative">
              <div className={`flex items-center gap-3 py-3 px-3 rounded-lg transition-all ${
                status === 'completed' ? 'bg-green-500/10' :
                status === 'executing' ? 'bg-primary/10' :
                status === 'current' ? 'bg-accent/50' :
                'opacity-50'
              }`}>
                {/* Status Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  status === 'completed' ? 'bg-green-500 text-white' :
                  status === 'executing' ? 'bg-primary text-primary-foreground' :
                  status === 'current' ? 'bg-primary/20 text-primary border-2 border-primary' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : status === 'executing' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : status === 'current' ? (
                    <Icon className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </div>

                {/* Step Title */}
                <span className={`text-sm font-medium ${
                  status === 'completed' ? 'text-green-600 dark:text-green-400' :
                  status === 'executing' || status === 'current' ? 'text-foreground' :
                  'text-muted-foreground'
                }`}>
                  {step.title}
                </span>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div className={`absolute left-[1.35rem] top-[3rem] w-0.5 h-4 ${
                  status === 'completed' ? 'bg-green-500' : 'bg-border'
                }`} />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default SigmaProgressPanel;
