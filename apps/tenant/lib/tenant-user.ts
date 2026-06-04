import { isDemoPreviewAccount } from '@/lib/demo-account';

/** Locally registered tenants (device signup) — not agency API users. */
export function isLocalRegisteredUser(userId: string | null | undefined): boolean {
  return Boolean(userId?.startsWith('tenant-'));
}

/**
 * Show bundled mock tenancy (lease, repairs, messages, …).
 * - API users (e.g. system@) when demo env is on
 * - demo@crossub.com.au preview account (always, including local signup)
 */
export function shouldShowDemoTenancy(
  userId: string | null | undefined,
  authed: boolean,
  demoEnv: boolean,
  email?: string | null,
): boolean {
  if (!authed || !userId) return false;
  if (isDemoPreviewAccount(email)) return true;
  if (isLocalRegisteredUser(userId)) return false;
  return demoEnv;
}
