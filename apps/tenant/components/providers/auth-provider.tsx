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
  purgeLocalAccountForEmail,
} from '@/lib/local-auth';
import { isDemoTenantEmail } from '@/lib/tenant-user';

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

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<{ user: AuthUser }>('/auth/me');
      if (isDemoTenantEmail(data.user.email)) {
        purgeLocalAccountForEmail(data.user.email);
      }
      clearLocalSession();
      setUser(data.user);
      setStatus('authed');
      return;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        const localUser = getLocalSessionUser();
        if (localUser && hasLocalAccessCookie()) {
          if (isDemoTenantEmail(localUser.email)) {
            clearLocalSession();
            setUser(null);
            setStatus('guest');
            return;
          }
          setUser(localUser);
          setStatus('authed');
          return;
        }
        setUser(null);
        setStatus('guest');
        return;
      }
      const localUser = getLocalSessionUser();
      if (localUser && hasLocalAccessCookie()) {
        if (isDemoTenantEmail(localUser.email)) {
          clearLocalSession();
          setUser(null);
          setStatus('guest');
          return;
        }
        setUser(localUser);
        setStatus('authed');
        return;
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
