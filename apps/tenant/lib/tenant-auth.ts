import { COOKIE_ACCESS, COOKIE_REFRESH } from '@/constants/auth';
import { Role } from '@/constants/roles';
import type { AuthUser } from '@/lib/auth-types';
import { api } from '@/lib/api';

/** Only real tenant users may use this portal (not staff/admin mobile roles). */
export function isTenantPortalUser(user: Pick<AuthUser, 'role'> | null | undefined): boolean {
  return user?.role === Role.TENANT;
}

/** Clear a session issued by another CROSSUB portal (e.g. admin web on localhost). */
export async function clearForeignPortalSession(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    /* API may be offline */
  }
  if (typeof document !== 'undefined') {
    document.cookie = `${COOKIE_ACCESS}=; path=/; max-age=0`;
    document.cookie = `${COOKIE_REFRESH}=; path=/api/auth; max-age=0`;
    document.cookie = `${COOKIE_REFRESH}=; path=/; max-age=0`;
  }
}
