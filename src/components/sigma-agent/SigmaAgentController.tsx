import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createSigmaService } from '@/services/sigmaAgentService';

export interface AgentState {
  resume_uploaded: boolean;
  resume_parsed: boolean;
  career_analysis_completed: boolean;
  skill_validation_completed: boolean;
  learning_plan_completed: boolean;
  project_guidance_completed: boolean;
  job_matching_completed: boolean;
}

export interface AgentStep {
  id: string;
  name: string;
  status: 'pending' | 'executing' | 'completed' | 'blocked';
  data?: any;
  error?: string;
}

export interface AgentControllerProps {
  children: (props: {
    agentState: AgentState;
    currentStep: AgentStep | null;
    executeStep: (stepId: string, userSelection?: any) => Promise<void>;
    isExecuting: boolean;
    canExecute: (stepId: string) => boolean;
    statusMessage: string;
  }) => React.ReactNode;
}

const SigmaAgentController: React.FC<AgentControllerProps> = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [agentState, setAgentState] = useState<AgentState>({
    resume_uploaded: false,
    resume_parsed: false,
    career_analysis_completed: false,
    skill_validation_completed: false,
    learning_plan_completed: false,
    project_guidance_completed: false,
    job_matching_completed: false,
  });

  const [currentStep, setCurrentStep] = useState<AgentStep | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Initializing...');

  useEffect(() => {
    if (user) {
      loadAgentState();
    }
  }, [user]);

  // Auto-execution logic for fully autonomous flow
  useEffect(() => {
    if (!currentStep || !user || isExecuting) return;

    // Auto-execute skill validation after career analysis (goal-based, no selection needed)
    if (currentStep.id === 'skill_validation' && 
        currentStep.status === 'pending' && 
        agentState.career_analysis_completed && 
        !agentState.skill_validation_completed) {
      setStatusMessage('Validating your skills against career goal...');
      const timer = setTimeout(() => executeStep('skill_validation'), 1500);
      return () => clearTimeout(timer);
    }

    // Auto-execute learning plan after skill validation
    if (currentStep.id === 'learning_plan' && 
        currentStep.status === 'pending' && 
        agentState.skill_validation_completed && 
        !agentState.learning_plan_completed) {
      setStatusMessage('Generating personalized learning plan...');
      const timer = setTimeout(() => executeStep('learning_plan'), 1500);
      return () => clearTimeout(timer);
    }

    // Auto-execute project ideas after learning plan
    if (currentStep.id === 'project_ideas' && 
        currentStep.status === 'pending' && 
        agentState.learning_plan_completed && 
        !agentState.project_guidance_completed) {
      setStatusMessage('Creating project recommendations...');
      const timer = setTimeout(() => executeStep('project_ideas'), 1500);
      return () => clearTimeout(timer);
    }

    // Auto-execute job matching after project ideas
    if (currentStep.id === 'job_matching' && 
        currentStep.status === 'pending' && 
        agentState.project_guidance_completed &&
        !agentState.job_matching_completed) {
      setStatusMessage('Finding job matches for you...');
      const timer = setTimeout(() => executeStep('job_matching'), 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, agentState, user, isExecuting]);

  const loadAgentState = async () => {
    if (!user) return;

    try {
      setStatusMessage('Loading your progress...');
      
      const { data: resumeData } = await supabase
        .from('resume_analysis')
        .select('id, parsed_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: journeyData } = await supabase
        .rpc('get_sigma_journey_state', { p_user_id: user.id });

      const newState: AgentState = {
        resume_uploaded: !!resumeData,
        resume_parsed: !!(resumeData?.parsed_data),
        career_analysis_completed: Boolean((journeyData as any)?.career_analysis_completed),
        skill_validation_completed: Boolean((journeyData as any)?.skill_validation_completed),
        learning_plan_completed: Boolean((journeyData as any)?.learning_plan_completed),
        project_guidance_completed: Boolean((journeyData as any)?.project_guidance_completed),
        job_matching_completed: Boolean((journeyData as any)?.job_matching_completed),
      };

      setAgentState(newState);
      await determineCurrentStep(newState);
    } catch (error) {
      console.error('Error loading agent state:', error);
      setStatusMessage('Error loading state');
    }
  };

  const determineCurrentStep = async (state: AgentState) => {
    if (!state.resume_uploaded || !state.resume_parsed) {
      setStatusMessage('Resume required to begin');
      setCurrentStep({
        id: 'entry_gate',
        name: 'Resume Required',
        status: 'blocked'
      });
      return;
    }

    if (!state.career_analysis_completed) {
      setStatusMessage('Ready to analyze your career path');
      setCurrentStep({ id: 'career_analysis', name: 'Career Analysis', status: 'pending' });
    } else if (!state.skill_validation_completed) {
      setStatusMessage('Preparing skill validation...');
      setCurrentStep({ id: 'skill_validation', name: 'Skill Validation', status: 'pending' });
    } else if (!state.learning_plan_completed) {
      setStatusMessage('Creating your learning plan...');
      setCurrentStep({ id: 'learning_plan', name: 'Learning Plan', status: 'pending' });
    } else if (!state.project_guidance_completed) {
      setStatusMessage('Generating project ideas...');
      setCurrentStep({ id: 'project_ideas', name: 'Project Ideas', status: 'pending' });
    } else if (!state.job_matching_completed) {
      setStatusMessage('Finding matching jobs...');
      setCurrentStep({ id: 'job_matching', name: 'Job Matching', status: 'pending' });
    } else {
      setStatusMessage('Career journey complete!');
      setCurrentStep({ id: 'completed', name: 'Journey Complete', status: 'completed' });
    }
  };

  const canExecute = (stepId: string): boolean => {
    if (isExecuting || !currentStep || currentStep.status === 'blocked') return false;
    return currentStep.id === stepId;
  };

  const executeStep = async (stepId: string, userSelection?: any) => {
    if (!canExecute(stepId) || !user) return;

    setIsExecuting(true);
    setCurrentStep(prev => prev ? { ...prev, status: 'executing' } : null);

    // Set appropriate status message
    const statusMessages: Record<string, string> = {
      career_analysis: 'Analyzing your resume and identifying career paths...',
      skill_validation: 'Validating your skills against career requirements...',
      learning_plan: 'Generating your personalized learning roadmap...',
      project_ideas: 'Creating project recommendations to build your portfolio...',
      job_matching: 'Finding the best job matches for your profile...'
    };
    setStatusMessage(statusMessages[stepId] || 'Processing...');

    try {
      const service = createSigmaService(user.id);
      let result;

      switch (stepId) {
        case 'career_analysis':
          result = await service.executeCareerAnalysis();
          break;
        case 'skill_validation':
          result = await service.executeSkillValidationGoalBased();
          break;
        case 'learning_plan':
          result = await service.executeLearningPlanAuto();
          break;
        case 'project_ideas':
          result = await service.executeProjectIdeas();
          break;
        case 'job_matching':
          result = await service.executeJobMatching();
          break;
        default:
          throw new Error(`Unknown step: ${stepId}`);
      }

      if (!result.success) throw new Error(result.error);

      setCurrentStep(prev => prev ? { ...prev, status: 'completed', data: result.data } : null);
      setStatusMessage(`${stepId.replace('_', ' ')} completed!`);
      toast.success(`Step completed successfully!`);
      
      setTimeout(() => loadAgentState(), 500);
    } catch (error) {
      console.error(`Error executing step ${stepId}:`, error);
      setCurrentStep(prev => prev ? { ...prev, status: 'pending', error: error instanceof Error ? error.message : 'Unknown error' } : null);
      setStatusMessage('Error occurred. Click to retry.');
      toast.error(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return <>{children({ agentState, currentStep, executeStep, isExecuting, canExecute, statusMessage })}</>;
};

export default SigmaAgentController;
