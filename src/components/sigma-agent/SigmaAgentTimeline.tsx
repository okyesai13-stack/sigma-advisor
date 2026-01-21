import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Brain,
  CheckCircle2,
  Loader2,
  Target,
  BookOpen,
  Lightbulb,
  Briefcase,
  Circle
} from 'lucide-react';
import { AgentState, AgentStep } from './SigmaAgentController';
import SigmaProgressPanel from './SigmaProgressPanel';
import SigmaOutputPanel from './SigmaOutputPanel';
import SigmaStatusPanel from './SigmaStatusPanel';

interface AgentTimelineProps {
  agentState: AgentState;
  currentStep: AgentStep | null;
  executeStep: (stepId: string, userSelection?: any) => Promise<void>;
  isExecuting: boolean;
  canExecute: (stepId: string) => boolean;
  statusMessage: string;
}

export const SIGMA_STEPS = [
  { id: 'career_analysis', title: 'Career Analysis', icon: Brain, stateKey: 'career_analysis_completed' },
  { id: 'skill_validation', title: 'Skill Validation', icon: Target, stateKey: 'skill_validation_completed' },
  { id: 'learning_plan', title: 'Learning Plan', icon: BookOpen, stateKey: 'learning_plan_completed' },
  { id: 'project_ideas', title: 'Project Ideas', icon: Lightbulb, stateKey: 'project_guidance_completed' },
  { id: 'job_matching', title: 'Job Matching', icon: Briefcase, stateKey: 'job_matching_completed' },
];

const SigmaAgentTimeline: React.FC<AgentTimelineProps> = ({
  agentState,
  currentStep,
  executeStep,
  isExecuting,
  canExecute,
  statusMessage
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasNavigated, setHasNavigated] = useState(false);

  const getStepStatus = (stepId: string, stateKey: string) => {
    if (agentState[stateKey as keyof AgentState]) return 'completed';
    if (currentStep?.id === stepId) {
      if (isExecuting) return 'executing';
      return 'current';
    }
    return 'pending';
  };

  const allCompleted = SIGMA_STEPS.every(step => agentState[step.stateKey as keyof AgentState]);

  // Auto-navigate to advisor page when all steps are complete
  useEffect(() => {
    const markProfileCompleteAndNavigate = async () => {
      if (allCompleted && !hasNavigated && user) {
        setHasNavigated(true);
        
        try {
          await supabase
            .from('sigma_journey_state')
            .update({ 
              profile_completed: true, 
              updated_at: new Date().toISOString() 
            })
            .eq('user_id', user.id);
        } catch (error) {
          console.error('Error marking profile complete:', error);
        }

        const timer = setTimeout(() => {
          toast.success('Career analysis complete! Redirecting to AI Advisor...');
          navigate('/advisor');
        }, 2500);
        return () => clearTimeout(timer);
      }
    };
    
    markProfileCompleteAndNavigate();
  }, [allCompleted, hasNavigated, navigate, user]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[70vh]">
      {/* Left Panel - Progress Tracker */}
      <div className="lg:col-span-3">
        <SigmaProgressPanel
          steps={SIGMA_STEPS}
          agentState={agentState}
          currentStep={currentStep}
          isExecuting={isExecuting}
          getStepStatus={getStepStatus}
        />
      </div>

      {/* Center Panel - AI Output */}
      <div className="lg:col-span-6">
        <SigmaOutputPanel
          agentState={agentState}
          currentStep={currentStep}
          executeStep={executeStep}
          isExecuting={isExecuting}
          canExecute={canExecute}
          allCompleted={allCompleted}
        />
      </div>

      {/* Right Panel - AI Status */}
      <div className="lg:col-span-3">
        <SigmaStatusPanel
          currentStep={currentStep}
          isExecuting={isExecuting}
          statusMessage={statusMessage}
          allCompleted={allCompleted}
        />
      </div>
    </div>
  );
};

export default SigmaAgentTimeline;
