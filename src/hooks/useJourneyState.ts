import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface JourneyState {
  profile_completed: boolean;
  career_recommended: boolean;
  career_selected: boolean;
  skill_validated: boolean;
  learning_completed: boolean;
  projects_completed: boolean;
  job_ready: boolean;
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
  career_recommended: false,
  career_selected: false,
  skill_validated: false,
  learning_completed: false,
  projects_completed: false,
  job_ready: false,
  interview_completed: false,
};

export const useJourneyState = (): UseJourneyStateReturn => {
  const { user } = useAuth();
  const [journeyState, setJourneyState] = useState<JourneyState | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchState = async () => {
    if (!user) {
      setJourneyState(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_journey_state')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No record found, create one
          const { data: newData, error: insertError } = await supabase
            .from('user_journey_state')
            .insert({ user_id: user.id })
            .select()
            .single();
          
          if (!insertError && newData) {
            setJourneyState({
              profile_completed: newData.profile_completed ?? false,
              career_recommended: newData.career_recommended ?? false,
              career_selected: newData.career_selected ?? false,
              skill_validated: newData.skill_validated ?? false,
              learning_completed: newData.learning_completed ?? false,
              projects_completed: newData.projects_completed ?? false,
              job_ready: newData.job_ready ?? false,
              interview_completed: newData.interview_completed ?? false,
            });
          } else {
            setJourneyState(defaultState);
          }
        } else {
          console.error('Error fetching journey state:', error);
          setJourneyState(defaultState);
        }
      } else if (data) {
        setJourneyState({
          profile_completed: data.profile_completed ?? false,
          career_recommended: data.career_recommended ?? false,
          career_selected: data.career_selected ?? false,
          skill_validated: data.skill_validated ?? false,
          learning_completed: data.learning_completed ?? false,
          projects_completed: data.projects_completed ?? false,
          job_ready: data.job_ready ?? false,
          interview_completed: data.interview_completed ?? false,
        });
      }
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
      const { error } = await supabase
        .from('user_journey_state')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating journey state:', error);
        return;
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
