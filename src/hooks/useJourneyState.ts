import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface JourneyState {
  profile_completed: boolean;
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

interface UseJourneyStateReturn {
  journeyState: JourneyState | null;
  loading: boolean;
  refreshState: () => Promise<void>;
  updateState: (updates: Partial<JourneyState>) => Promise<void>;
}

const defaultState: JourneyState = {
  profile_completed: false,
  career_analysis_completed: false,
  skill_validation_completed: false,
  learning_plan_completed: false,
  project_guidance_completed: false,
  project_plan_completed: false,
  project_build_completed: false,
  resume_completed: false,
  job_matching_completed: false,
  interview_completed: false,
};

export const useJourneyState = (): UseJourneyStateReturn => {
  const { user } = useAuth();
  const [journeyState, setJourneyState] = useState<JourneyState | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if profile_completed is true in sigma_journey_state
  const checkProfileCompleted = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('sigma_journey_state')
        .select('profile_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.warn('Unable to check sigma_journey_state:', error);
        return false;
      }

      return data?.profile_completed ?? false;
    } catch (err) {
      console.warn('Unable to check sigma_journey_state:', err);
      return false;
    }
  };

  const fetchState = async () => {
    if (!user) {
      setJourneyState(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Use sigma_journey_state table
      const { data, error } = await supabase
        .from('sigma_journey_state')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching journey state:', error);
        setJourneyState(defaultState);
        setLoading(false);
        return;
      }

      // If no record exists, create one
      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from('sigma_journey_state')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError || !newData) {
          console.error('Error creating journey state:', insertError);
          setJourneyState(defaultState);
          setLoading(false);
          return;
        }

        setJourneyState({
          profile_completed: newData.profile_completed ?? false,
          career_analysis_completed: newData.career_analysis_completed ?? false,
          skill_validation_completed: newData.skill_validation_completed ?? false,
          learning_plan_completed: newData.learning_plan_completed ?? false,
          project_guidance_completed: newData.project_guidance_completed ?? false,
          project_plan_completed: newData.project_plan_completed ?? false,
          project_build_completed: newData.project_build_completed ?? false,
          resume_completed: newData.resume_completed ?? false,
          job_matching_completed: newData.job_matching_completed ?? false,
          interview_completed: newData.interview_completed ?? false,
        });
        setLoading(false);
        return;
      }

      // Record exists - use data from sigma_journey_state directly
      setJourneyState({
        profile_completed: data.profile_completed ?? false,
        career_analysis_completed: data.career_analysis_completed ?? false,
        skill_validation_completed: data.skill_validation_completed ?? false,
        learning_plan_completed: data.learning_plan_completed ?? false,
        project_guidance_completed: data.project_guidance_completed ?? false,
        project_plan_completed: data.project_plan_completed ?? false,
        project_build_completed: data.project_build_completed ?? false,
        resume_completed: data.resume_completed ?? false,
        job_matching_completed: data.job_matching_completed ?? false,
        interview_completed: data.interview_completed ?? false,
      });
    } catch (error) {
      console.error('Error fetching journey state:', error);
      setJourneyState(defaultState);
    } finally {
      setLoading(false);
    }
  };

  const updateState = async (updates: Partial<JourneyState>) => {
    if (!user) return;

    try {
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('sigma_journey_state')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating journey state:', error);
          return;
        }
      }

      setJourneyState((prev) => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating journey state:', error);
    }
  };

  useEffect(() => {
    fetchState();
  }, [user]);

  return {
    journeyState,
    loading,
    refreshState: fetchState,
    updateState,
  };
};

// Page guard hook
export const usePageGuard = (requiredState: keyof JourneyState | null, redirectTo: string = '/setup') => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { journeyState, loading: stateLoading } = useJourneyState();

  useEffect(() => {
    if (authLoading || stateLoading) return;

    if (!user) {
      navigate('/auth');
      return;
    }

    if (requiredState && journeyState && !journeyState[requiredState]) {
      navigate(redirectTo);
    }
  }, [user, journeyState, authLoading, stateLoading, requiredState, redirectTo, navigate]);

  return { loading: authLoading || stateLoading, journeyState };
};
