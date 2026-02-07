import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

const STORAGE_KEY = 'sigma_resume_id';
const GOAL_KEY = 'sigma_goal';
const CHALLENGE_KEY = 'sigma_challenge';
const USER_TYPE_KEY = 'sigma_user_type';

export const ResumeProvider = ({ children }: { children: ReactNode }) => {
  const [resumeId, setResumeIdState] = useState<string | null>(null);
  const [goal, setGoalState] = useState<string | null>(null);
  const [challenge, setChallengeState] = useState<string | null>(null);
  const [userType, setUserTypeState] = useState<string>('student');
  const [isReady, setIsReady] = useState(false);

  // Load from sessionStorage on mount
  useEffect(() => {
    const storedResumeId = sessionStorage.getItem(STORAGE_KEY);
    const storedGoal = sessionStorage.getItem(GOAL_KEY);
    const storedChallenge = sessionStorage.getItem(CHALLENGE_KEY);
    const storedUserType = sessionStorage.getItem(USER_TYPE_KEY);
    
    if (storedResumeId) setResumeIdState(storedResumeId);
    if (storedGoal) setGoalState(storedGoal);
    if (storedChallenge) setChallengeState(storedChallenge);
    if (storedUserType) setUserTypeState(storedUserType);
    
    setIsReady(true);
  }, []);

  const setResumeId = (id: string | null) => {
    setResumeIdState(id);
    if (id) {
      sessionStorage.setItem(STORAGE_KEY, id);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  };

  const setGoal = (newGoal: string | null) => {
    setGoalState(newGoal);
    if (newGoal) {
      sessionStorage.setItem(GOAL_KEY, newGoal);
    } else {
      sessionStorage.removeItem(GOAL_KEY);
    }
  };

  const setChallenge = (newChallenge: string | null) => {
    setChallengeState(newChallenge);
    if (newChallenge) {
      sessionStorage.setItem(CHALLENGE_KEY, newChallenge);
    } else {
      sessionStorage.removeItem(CHALLENGE_KEY);
    }
  };

  const setUserType = (type: string) => {
    setUserTypeState(type);
    sessionStorage.setItem(USER_TYPE_KEY, type);
  };

  const clearSession = () => {
    setResumeIdState(null);
    setGoalState(null);
    setChallengeState(null);
    setUserTypeState('student');
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(GOAL_KEY);
    sessionStorage.removeItem(CHALLENGE_KEY);
    sessionStorage.removeItem(USER_TYPE_KEY);
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
