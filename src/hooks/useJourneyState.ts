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

  const isProfileComplete = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data: profile, error } = await supabase
        .from('users_profile')
        .select('goal_type, goal_description, interests, hobbies, activities')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.warn('Unable to check users_profile completeness:', error);
        return false;
      }

      if (!profile) return false;

      const hasGoal = Boolean(profile.goal_type && profile.goal_type.trim().length > 0);
      const hasGoalDescription = Boolean(profile.goal_description && profile.goal_description.trim().length > 0);
      const hasInterests = Array.isArray(profile.interests) && profile.interests.length > 0;
      const hasHobbies = Array.isArray(profile.hobbies) && profile.hobbies.length > 0;
      const hasActivities = Array.isArray(profile.activities) && profile.activities.length > 0;

      return hasGoal || hasGoalDescription || hasInterests || hasHobbies || hasActivities;
    } catch (err) {
      console.warn('Unable to check users_profile completeness:', err);
      return false;
    }
  };

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
        .maybeSingle();

      if (error) {
        console.error('Error fetching journey state:', error);
        setJourneyState(defaultState);
        return;
      }

      // If no record exists, create one.
      if (!data) {
        const profileCompleted = await isProfileComplete();

        const { data: newData, error: insertError } = await supabase
          .from('user_journey_state')
          .insert({ user_id: user.id, profile_completed: profileCompleted })
          .select()
          .single();

        if (insertError || !newData) {
          console.error('Error creating journey state:', insertError);
          setJourneyState(defaultState);
          return;
        }

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

        return;
      }

      // Record exists.
      let profile_completed = data.profile_completed ?? false;
      if (!profile_completed) {
        const computed = await isProfileComplete();
        if (computed) {
          profile_completed = true;
          await supabase
            .from('user_journey_state')
            .update({ profile_completed: true, updated_at: new Date().toISOString() })
            .eq('user_id', user.id);
        }
      }

      setJourneyState({
        profile_completed,
        career_recommended: data.career_recommended ?? false,
        career_selected: data.career_selected ?? false,
        skill_validated: data.skill_validated ?? false,
        learning_completed: data.learning_completed ?? false,
        projects_completed: data.projects_completed ?? false,
        job_ready: data.job_ready ?? false,
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
