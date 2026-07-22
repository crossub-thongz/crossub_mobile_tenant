'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { api, ApiError, clearSessionAndRedirectToLogin } from '@/lib/api';
import type { AuthUser } from '@/lib/auth-types';
import {
  clearForeignPortalSession,
  isTenantPortalUser,
} from '@/lib/tenant-auth';
import { isPublicRoute } from '@/constants/routes';

type AuthStatus = 'loading' | 'authed' | 'guest';

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const rejectForeignSession = useCallback(async () => {
    await clearForeignPortalSession();
    setUser(null);
    setStatus('guest');
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (!isPublicRoute(path)) {
        window.location.href = '/login?wrongPortal=1';
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<{ user: AuthUser }>('/auth/me');
      if (!isTenantPortalUser(data.user)) {
        await rejectForeignSession();
        return;
      }
      setUser(data.user);
      setStatus('authed');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
        setStatus('guest');
        if (
          typeof window !== 'undefined' &&
          !isPublicRoute(window.location.pathname)
        ) {
          await clearSessionAndRedirectToLogin();
        }
        return;
      }
      setUser(null);
      setStatus('guest');
    }
  }, [rejectForeignSession]);

  const logout = useCallback(async () => {
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
