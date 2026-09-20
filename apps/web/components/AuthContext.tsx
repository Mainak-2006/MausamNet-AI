'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import { apiFetch } from '@/lib/api';
import type { Profile } from '@/lib/types';

interface AuthContextValue {
  session: Session | null;
  user: Profile | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  isLoading: true,
  refresh: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = session?.access_token;
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const profile = await apiFetch<Profile>('/api/users/me', { token });
      setUser(profile);
    } catch (err) {
      console.error('Failed to load profile', err);
      setUser(null);
    }
  }, [session?.access_token]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
      if (!nextSession) setUser(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    window.location.href = '/';
  }, []);

  const value = useMemo(
    () => ({ session, user, isLoading, refresh, signOut }),
    [session, user, isLoading, refresh, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}