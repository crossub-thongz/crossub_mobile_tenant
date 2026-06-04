import type { AuthUser } from '@/lib/auth-types';

const API_USER_CACHE_KEY = 'crossub_tenant_api_user';

export function cacheApiUser(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(API_USER_CACHE_KEY, JSON.stringify(user));
  } catch {
    /* private mode */
  }
}

export function readCachedApiUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(API_USER_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearApiUserCache(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(API_USER_CACHE_KEY);
}
