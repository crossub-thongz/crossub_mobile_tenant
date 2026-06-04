'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { COOKIE_ACCESS } from '@/constants/auth';
import { api, ApiError } from '@/lib/api';
import { cacheApiUser, clearCachedApiUser, readCachedApiUser } from '@/lib/api-session';
import type { AuthUser } from '@/lib/auth-types';
import {
  clearLocalSession,
  getLocalSessionUser,
  hasLocalAccessCookie,
  LOCAL_ACCESS_VALUE,
} from '@/lib/local-auth';

type AuthStatus = 'loading' | 'authed' | 'guest';

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  refresh: () => Promise<void>;
  /** After API login — use response user immediately (don't wait on /auth/me). */
  establishSession: (user: AuthUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function hasApiAccessCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => {
    const [name, value] = c.trim().split('=');
    return (
      name === COOKIE_ACCESS &&
      Boolean(value) &&
      value !== LOCAL_ACCESS_VALUE
    );
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const establishSession = useCallback((next: AuthUser) => {
    cacheApiUser(next);
    setUser(next);
    setStatus('authed');
  }, []);

  const refresh = useCallback(async () => {
    const localUser = getLocalSessionUser();
    if (localUser && hasLocalAccessCookie()) {
      setUser(localUser);
      setStatus('authed');
      return;
    }

    try {
      const data = await api.get<{ user: AuthUser }>('/auth/me');
      cacheApiUser(data.user);
      setUser(data.user);
      setStatus('authed');
      return;
    } catch (err) {
      const cached = readCachedApiUser();
      if (cached && hasApiAccessCookie()) {
        setUser(cached);
        setStatus('authed');
        return;
      }

      if (err instanceof ApiError && err.status === 401) {
        const fallback = getLocalSessionUser();
        if (fallback && hasLocalAccessCookie()) {
          setUser(fallback);
          setStatus('authed');
          return;
        }
        clearCachedApiUser();
        setUser(null);
        setStatus('guest');
        return;
      }

      const fallbackLocal = getLocalSessionUser();
      if (fallbackLocal && hasLocalAccessCookie()) {
        setUser(fallbackLocal);
        setStatus('authed');
        return;
      }

      if (cached && hasApiAccessCookie()) {
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
    clearCachedApiUser();
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
