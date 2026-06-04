import type { AuthUser } from '@/lib/auth-types';
import { isLocalRegisteredUser } from '@/lib/tenant-user';

const API_SESSION_KEY = 'crossub_tenant_api_user';

export function persistApiSessionUser(user: AuthUser | null | undefined): void {
  if (typeof window === 'undefined' || !user?.id || isLocalRegisteredUser(user.id)) {
    return;
  }
  try {
    sessionStorage.setItem(API_SESSION_KEY, JSON.stringify(user));
  } catch {
    /* private mode */
  }
}

export function getPersistedApiSessionUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(API_SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function clearApiSessionUser(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(API_SESSION_KEY);
}
