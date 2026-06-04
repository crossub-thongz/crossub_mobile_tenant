/** Locally registered tenants (device signup) — not agency API users. */
export function isLocalRegisteredUser(userId: string | null | undefined): boolean {
  return Boolean(userId?.startsWith('tenant-'));
}

/** Always show full mock tenancy for these API accounts (e.g. staging / demo logins). */
const BUILTIN_DEMO_TENANT_EMAILS = [
  'justin.looi@crossub.com.au',
  'system@crossub.com.au',
] as const;

function parseEnvDemoEmails(): string[] {
  const raw = process.env.NEXT_PUBLIC_DEMO_TENANT_EMAILS;
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function getDemoTenantEmails(): string[] {
  const set = new Set<string>([
    ...BUILTIN_DEMO_TENANT_EMAILS.map((e) => e.toLowerCase()),
    ...parseEnvDemoEmails(),
  ]);
  return [...set];
}

export function isDemoTenantEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getDemoTenantEmails().includes(email.trim().toLowerCase());
}

export function shouldShowDemoTenancy(
  userId: string | null | undefined,
  authed: boolean,
  demoEnv: boolean,
  email?: string | null,
): boolean {
  if (!authed || !userId) return false;
  /** Demo agency accounts always get seed data — even if they were created via Register tab. */
  if (isDemoTenantEmail(email)) return true;
  if (isLocalRegisteredUser(userId)) return false;
  return demoEnv;
}
