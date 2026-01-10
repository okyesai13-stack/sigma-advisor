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
  project_plan_completed: boolean;
  project_build_completed: boolean;
  resume_completed: boolean;
  job_matching_completed: boolean;
  interview_completed: boolean;
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
    project_plan_completed: false,
    project_build_completed: false,
    resume_completed: false,
    job_matching_completed: false,
    interview_completed: false,
  });

  const [currentStep, setCurrentStep] = useState<AgentStep | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (user) {
      loadAgentState();
    }
  }, [user]);

  // Auto-execution logic
  useEffect(() => {
    if (!currentStep || !user || isExecuting) return;

    // Auto-execute project_ideas after learning plan
    if (currentStep.id === 'project_ideas' && 
        currentStep.status === 'pending' && 
        agentState.learning_plan_completed && 
        !agentState.project_guidance_completed) {
      const timer = setTimeout(() => executeStep('project_ideas'), 1500);
      return () => clearTimeout(timer);
    }

    // Auto-execute project_build after project plan
    if (currentStep.id === 'project_build' && 
        currentStep.status === 'pending' && 
        agentState.project_plan_completed &&
        !agentState.project_build_completed) {
      
      if (currentStep.data?.selectedProject) {
        const timer = setTimeout(() => executeStep('project_build', currentStep.data.selectedProject), 2000);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => executeStep('project_build'), 2000);
        return () => clearTimeout(timer);
      }
    }

    // Auto-execute resume_upgrade after project build
    if (currentStep.id === 'resume_upgrade' && 
        currentStep.status === 'pending' && 
        agentState.project_build_completed &&
        !agentState.resume_completed) {
      const timer = setTimeout(() => executeStep('resume_upgrade'), 1500);
      return () => clearTimeout(timer);
    }

    // Auto-execute job_matching after resume
    if (currentStep.id === 'job_matching' && 
        currentStep.status === 'pending' && 
        agentState.resume_completed &&
        !agentState.job_matching_completed) {
      const timer = setTimeout(() => executeStep('job_matching'), 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, agentState, user, isExecuting]);

  const loadAgentState = async () => {
    if (!user) return;

    try {
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
        project_plan_completed: Boolean((journeyData as any)?.project_plan_completed),
        project_build_completed: Boolean((journeyData as any)?.project_build_completed),
        resume_completed: Boolean((journeyData as any)?.resume_completed),
        job_matching_completed: Boolean((journeyData as any)?.job_matching_completed),
        interview_completed: Boolean((journeyData as any)?.interview_completed),
      };

      setAgentState(newState);
      await determineCurrentStep(newState);
    } catch (error) {
      console.error('Error loading agent state:', error);
    }
  };

  const determineCurrentStep = async (state: AgentState) => {
    if (!state.resume_uploaded || !state.resume_parsed) {
      setCurrentStep({
        id: 'entry_gate',
        name: 'Resume Required',
        status: 'blocked'
      });
      return;
    }

    if (!state.career_analysis_completed) {
      setCurrentStep({ id: 'career_analysis', name: 'Career Analysis', status: 'pending' });
    } else if (!state.skill_validation_completed) {
      const careerData = await loadCareerMatches();
      setCurrentStep({ id: 'skill_validation', name: 'Skill Validation', status: 'pending', data: careerData });
    } else if (!state.learning_plan_completed) {
      const skillData = await loadSkillValidationData();
      setCurrentStep({ id: 'learning_plan', name: 'Learning Plan', status: 'pending', data: skillData });
    } else if (!state.project_guidance_completed) {
      setCurrentStep({ id: 'project_ideas', name: 'Project Ideas', status: 'pending' });
    } else if (!state.project_plan_completed) {
      const projectData = await loadProjectIdeas();
      setCurrentStep({ id: 'project_plan', name: 'Project Planning', status: 'pending', data: projectData });
    } else if (!state.project_build_completed) {
      const selectedProjectData = await loadSelectedProject();
      setCurrentStep({ id: 'project_build', name: 'Build Tools', status: 'pending', data: selectedProjectData });
    } else if (!state.resume_completed) {
      setCurrentStep({ id: 'resume_upgrade', name: 'Resume Upgrade', status: 'pending' });
    } else if (!state.job_matching_completed) {
      setCurrentStep({ id: 'job_matching', name: 'Job Matching', status: 'pending' });
    } else if (!state.interview_completed) {
      const jobData = await loadJobRecommendations();
      setCurrentStep({ id: 'interview_prep', name: 'Interview Prep', status: 'pending', data: jobData });
    } else {
      setCurrentStep({ id: 'completed', name: 'Journey Complete', status: 'completed' });
    }
  };

  const loadCareerMatches = async () => {
    try {
      // Load from resume_career_advice table (where career analysis results are stored)
      const { data: careerAdvice, error } = await supabase
        .from('resume_career_advice')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading career advice:', error);
        return { careerMatches: [] };
      }

      if (careerAdvice?.career_advice) {
        const advice = careerAdvice.career_advice as any;
        const roles = advice?.roles || [];
        
        console.log('Loaded career matches from resume_career_advice:', roles);
        
        return { 
          careerMatches: roles.map((role: any, index: number) => ({
            id: role.id || `role_${index}`,
            role: role.role,
            domain: role.domain,
            match_score: role.match_score || 0,
            rationale: role.rationale,
            required_skills: role.required_skills || [],
            growth_potential: role.growth_potential
          }))
        };
      }
      return { careerMatches: [] };
    } catch (error) {
      console.error('Error loading career matches:', error);
      return { careerMatches: [] };
    }
  };

  const loadSkillValidationData = async () => {
    try {
      const { data: skillValidation } = await supabase
        .from('skill_validations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return { skillValidation };
    } catch (error) {
      console.error('Error loading skill validation data:', error);
      return { skillValidation: null };
    }
  };

  const loadProjectIdeas = async () => {
    try {
      const { data: projectIdeas } = await supabase
        .from('project_ideas')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      return { projects: projectIdeas || [] };
    } catch (error) {
      console.error('Error loading project ideas:', error);
      return { projects: [] };
    }
  };

  const loadJobRecommendations = async () => {
    try {
      const { data: jobRecommendations } = await supabase
        .from('ai_job_recommendations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      return { jobs: jobRecommendations || [] };
    } catch (error) {
      console.error('Error loading job recommendations:', error);
      return { jobs: [] };
    }
  };

  const loadSelectedProject = async () => {
    try {
      // Strategy 1: Get the most recent project detail to find the selected project
      const { data: projectDetail } = await supabase
        .from('project_detail')
        .select(`
          project_id,
          project_ideas (
            id,
            title,
            description,
            problem,
            domain
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (projectDetail?.project_ideas) {
        const selectedProject = {
          id: projectDetail.project_ideas.id,
          title: projectDetail.project_ideas.title,
          description: projectDetail.project_ideas.description,
          problem: projectDetail.project_ideas.problem,
          domain: projectDetail.project_ideas.domain
        };
        return { selectedProject };
      }
      
      // Strategy 2: If no project_detail found, get the most recent project idea
      const { data: recentProject } = await supabase
        .from('project_ideas')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentProject) {
        const selectedProject = {
          id: recentProject.id,
          title: recentProject.title,
          description: recentProject.description,
          problem: recentProject.problem,
          domain: recentProject.domain
        };
        return { selectedProject };
      }
      
      return { selectedProject: null };
    } catch (error) {
      console.error('Error loading selected project:', error);
      return { selectedProject: null };
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

    try {
      const service = createSigmaService(user.id);
      let result;

      switch (stepId) {
        case 'career_analysis':
          result = await service.executeCareerAnalysis();
          break;
        case 'skill_validation':
          result = await service.executeSkillValidation(userSelection);
          break;
        case 'learning_plan':
          result = await service.executeLearningPlan(userSelection);
          break;
        case 'project_ideas':
          result = await service.executeProjectIdeas();
          break;
        case 'project_plan':
          result = await service.executeProjectPlan(userSelection);
          break;
        case 'project_build':
          result = await service.executeProjectBuild(userSelection);
          break;
        case 'resume_upgrade':
          result = await service.executeResumeUpgrade();
          break;
        case 'job_matching':
          result = await service.executeJobMatching();
          break;
        case 'interview_prep':
          result = await service.executeInterviewPrep(userSelection);
          break;
        default:
          throw new Error(`Unknown step: ${stepId}`);
      }

      if (!result.success) throw new Error(result.error);

      setCurrentStep(prev => prev ? { ...prev, status: 'completed', data: result.data } : null);
      toast.success(`${stepId.replace('_', ' ')} completed!`);
      
      setTimeout(() => loadAgentState(), 500);
    } catch (error) {
      console.error(`Error executing step ${stepId}:`, error);
      setCurrentStep(prev => prev ? { ...prev, status: 'pending', error: error instanceof Error ? error.message : 'Unknown error' } : null);
      toast.error(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return <>{children({ agentState, currentStep, executeStep, isExecuting, canExecute })}</>;
};

export default SigmaAgentController;
