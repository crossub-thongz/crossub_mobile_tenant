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
  hasStaleLocalCookie,
  isLocalAccessCookie,
} from '@/lib/local-auth';

type AuthStatus = 'loading' | 'authed' | 'guest';

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function clearApiSession(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    /* API may be offline */
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const refresh = useCallback(async () => {
    if (hasStaleLocalCookie()) {
      clearLocalSession();
      setUser(null);
      setStatus('guest');
      return;
    }

    if (isLocalAccessCookie()) {
      const localUser = getLocalSessionUser();
      if (localUser) {
        setUser(localUser);
        setStatus('authed');
        return;
      }
      clearLocalSession();
      setUser(null);
      setStatus('guest');
      return;
    }

    try {
      const data = await api.get<{ user: AuthUser }>('/auth/me');
      setUser(data.user);
      setStatus('authed');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearLocalSession();
        await clearApiSession();
        setUser(null);
        setStatus('guest');
        return;
      }
      setUser(null);
      setStatus('guest');
    }
  }, []);

  const logout = useCallback(async () => {
    clearLocalSession();
    await clearApiSession();
    setUser(null);
    setStatus('guest');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, status, refresh, logout }}>
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
