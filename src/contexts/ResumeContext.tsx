import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Business {
  id: string;
  business_name: string;
  pitch: string;
  stage: string;
  industry: string | null;
  target_market: string | null;
  geography: string | null;
}

interface BusinessContextType {
  business: Business | null;
  setBusiness: (b: Business | null) => void;
  isReady: boolean;
  clearSession: () => void;
  reload: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const ResumeProvider = ({ children }: { children: ReactNode }) => {
  const [business, setBusinessState] = useState<Business | null>(null);
  const [isReady, setIsReady] = useState(false);

  const loadLatest = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setBusinessState(null);
        return;
      }
      const { data, error } = await supabase
        .from('business_store')
        .select('id, business_name, pitch, stage, industry, target_market, geography')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) console.warn('[business] load error', error);
      if (data) setBusinessState(data as Business);
    } catch (e) {
      console.warn('[business] load failed', e);
    }
  };

  useEffect(() => {
    (async () => {
      await loadLatest();
      setIsReady(true);
    })();

    // IMPORTANT: never await Supabase calls inside onAuthStateChange — it holds the
    // auth lock and freezes every other request. Defer the work instead.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) { setBusinessState(null); return; }
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setTimeout(() => { loadLatest(); }, 0);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <BusinessContext.Provider value={{
      business,
      setBusiness: setBusinessState,
      isReady,
      clearSession: () => setBusinessState(null),
      reload: loadLatest,
    }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useResume = (): BusinessContextType => {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error('useResume must be used within ResumeProvider');
  return ctx;
};

// Backwards-compatible alias
export const useBusiness = useResume;
