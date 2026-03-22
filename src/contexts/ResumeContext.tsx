import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ResumeContextType {
  resumeId: string | null;
  setResumeId: (id: string | null) => void;
  goal: string | null;
  setGoal: (goal: string | null) => void;
  challenge: string | null;
  setChallenge: (challenge: string | null) => void;
  userType: string;
  setUserType: (type: string) => void;
  isReady: boolean;
  clearSession: () => void;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export const ResumeProvider = ({ children }: { children: ReactNode }) => {
  const [resumeId, setResumeIdState] = useState<string | null>(null);
  const [goal, setGoalState] = useState<string | null>(null);
  const [challenge, setChallengeState] = useState<string | null>(null);
  const [userType, setUserTypeState] = useState<string>('student');
  const [isReady, setIsReady] = useState(false);

  // Auto-load resume from DB based on authenticated user
  useEffect(() => {
    const loadUserResume = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await (supabase.from('resume_store') as any)
          .select('resume_id, goal, challenge, user_type')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          setResumeIdState(data.resume_id);
          if (data.goal) setGoalState(data.goal);
          if (data.challenge) setChallengeState(data.challenge);
          if (data.user_type) setUserTypeState(data.user_type);
        }
      }
      setIsReady(true);
    };

    loadUserResume();

    // Listen for auth changes to reload resume
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data } = await (supabase.from('resume_store') as any)
          .select('resume_id, goal, challenge, user_type')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          setResumeIdState(data.resume_id);
          if (data.goal) setGoalState(data.goal);
          if (data.challenge) setChallengeState(data.challenge);
          if (data.user_type) setUserTypeState(data.user_type);
        }
      } else {
        // User signed out
        setResumeIdState(null);
        setGoalState(null);
        setChallengeState(null);
        setUserTypeState('student');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const setResumeId = (id: string | null) => {
    setResumeIdState(id);
  };

  const setGoal = (newGoal: string | null) => {
    setGoalState(newGoal);
  };

  const setChallenge = (newChallenge: string | null) => {
    setChallengeState(newChallenge);
  };

  const setUserType = (type: string) => {
    setUserTypeState(type);
  };

  const clearSession = () => {
    setResumeIdState(null);
    setGoalState(null);
    setChallengeState(null);
    setUserTypeState('student');
  };

  return (
    <ResumeContext.Provider value={{
      resumeId,
      setResumeId,
      goal,
      setGoal,
      challenge,
      setChallenge,
      userType,
      setUserType,
      isReady,
      clearSession,
    }}>
      {children}
    </ResumeContext.Provider>
  );
};

export const useResume = (): ResumeContextType => {
  const context = useContext(ResumeContext);
  if (context === undefined) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};
