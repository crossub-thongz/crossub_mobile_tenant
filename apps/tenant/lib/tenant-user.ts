import type { AuthUser } from '@/lib/auth-types';

/** Locally registered tenants (device signup) — not agency API users. */
export function isLocalRegisteredUser(userId: string | null | undefined): boolean {
  return Boolean(userId?.startsWith('tenant-'));
}

/** Agency accounts that always receive demo tenancy (even if build flag is off). */
const DEMO_PREVIEW_EMAILS = new Set([
  'admin@crossub.com.au',
  'system@crossub.com.au',
]);

export type TenantStorageKind = 'local' | 'api' | 'guest';

export function tenantStorageKind(
  user: Pick<AuthUser, 'id'> | null,
  isLocalSession: boolean,
): TenantStorageKind {
  if (!user?.id) return 'guest';
  if (isLocalSession || isLocalRegisteredUser(user.id)) return 'local';
  return 'api';
}

export function shouldShowDemoTenancy(
  user: Pick<AuthUser, 'id' | 'email'> | null,
  authed: boolean,
  demoEnv: boolean,
  isLocalSession: boolean,
): boolean {
  if (!authed || !user?.id) return false;
  if (isLocalSession || isLocalRegisteredUser(user.id)) return false;

  const email = user.email.trim().toLowerCase();
  if (DEMO_PREVIEW_EMAILS.has(email)) return true;

  return demoEnv;
}
