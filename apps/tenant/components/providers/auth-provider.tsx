'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { api, ApiError } from '@/lib/api';
import {
  clearApiSessionUser,
  getPersistedApiSessionUser,
  persistApiSessionUser,
} from '@/lib/api-session';
import { parseAuthUserPayload } from '@/lib/parse-auth-response';
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
  establishSession: (user: AuthUser) => void;
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

  const establishSession = useCallback((sessionUser: AuthUser) => {
    persistApiSessionUser(sessionUser);
    setUser(sessionUser);
    setStatus('authed');
  }, []);

  const refresh = useCallback(async () => {
    if (hasStaleLocalCookie()) {
      clearLocalSession();
      clearApiSessionUser();
      setUser(null);
      setStatus('guest');
      return;
    }

    if (isLocalAccessCookie()) {
      const localUser = getLocalSessionUser();
      if (localUser) {
        clearApiSessionUser();
        setUser(localUser);
        setStatus('authed');
        return;
      }
      clearLocalSession();
      clearApiSessionUser();
      setUser(null);
      setStatus('guest');
      return;
    }

    try {
      const data = await api.get<unknown>('/auth/me');
      const sessionUser = parseAuthUserPayload(data);
      if (!sessionUser) {
        throw new Error('Invalid session response from server');
      }
      persistApiSessionUser(sessionUser);
      setUser(sessionUser);
      setStatus('authed');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearLocalSession();
        clearApiSessionUser();
        await clearApiSession();
        setUser(null);
        setStatus('guest');
        return;
      }

      const cached = getPersistedApiSessionUser();
      if (cached) {
        setUser(cached);
        setStatus('authed');
        return;
      }

      setUser(null);
      setStatus('guest');
    }
  }, []);

  const logout = useCallback(async () => {
    clearLocalSession();
    clearApiSessionUser();
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
    <AuthContext.Provider
      value={{ user, status, refresh, establishSession, logout }}
    >
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
