/** API logins that should see the full demo tenancy (same as local dev). */
const DEMO_TENANCY_EMAILS = new Set([
  'system@crossub.com.au',
  'justin@crossub.com.au',
]);

export function isDemoTenancyEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return DEMO_TENANCY_EMAILS.has(email.trim().toLowerCase());
}
