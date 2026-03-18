import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/services/supabase/client';

type SessionState = {
  session: Session | null;
  initializing: boolean;
};

const SessionContext = createContext<SessionState | null>(null);

function isInvalidRefreshTokenError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return error.message.toLowerCase().includes('refresh token');
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!mounted) return;
      if (error) {
        if (isInvalidRefreshTokenError(error)) {
          await supabase.auth.signOut({ scope: 'local' });
        }
        // If this fails, we still want the app to render; auth screens will handle login.
        setSession(null);
      } else {
        setSession(data.session ?? null);
      }
      setInitializing(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setInitializing(false);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ session, initializing }), [session, initializing]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
