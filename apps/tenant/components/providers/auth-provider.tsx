'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { api, ApiError } from '@/lib/api';
import type { AuthUser } from '@/lib/auth-types';
import {
  clearLocalSession,
  getLocalSessionUser,
  hasLocalAccessCookie,
} from '@/lib/local-auth';

type AuthStatus = 'loading' | 'authed' | 'guest';

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  /** Call after API login returns `{ user }` so profile/data load before `/auth/me` round-trip. */
  setSession: (user: AuthUser) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const setSession = useCallback((nextUser: AuthUser) => {
    clearLocalSession();
    setUser(nextUser);
    setStatus('authed');
  }, []);

  const refresh = useCallback(async () => {
    if (hasLocalAccessCookie()) {
      const localUser = getLocalSessionUser();
      if (localUser) {
        setUser(localUser);
        setStatus('authed');
        return;
      }
    }

    try {
      const data = await api.get<{ user: AuthUser }>('/auth/me');
      clearLocalSession();
      setUser(data.user);
      setStatus('authed');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        if (hasLocalAccessCookie()) {
          const localUser = getLocalSessionUser();
          if (localUser) {
            setUser(localUser);
            setStatus('authed');
            return;
          }
        }
        setUser(null);
        setStatus('guest');
        return;
      }
      if (hasLocalAccessCookie()) {
        const localUser = getLocalSessionUser();
        if (localUser) {
          setUser(localUser);
          setStatus('authed');
          return;
        }
      }
      setUser(null);
      setStatus('guest');
    }
  }, []);

  const logout = useCallback(async () => {
    clearLocalSession();
    try {
      await api.post('/auth/logout');
    } catch {
      /* API may be offline */
    } finally {
      setUser(null);
      setStatus('guest');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, status, setSession, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
