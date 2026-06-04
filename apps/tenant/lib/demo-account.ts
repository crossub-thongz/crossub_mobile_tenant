/** Built-in production demo tenant — full mock tenancy (12 River Lane, repairs, etc.). */
export const DEMO_PREVIEW_EMAIL =
  process.env.NEXT_PUBLIC_DEMO_TENANT_EMAIL?.trim().toLowerCase() ||
  'demo@crossub.com.au';

export const DEMO_PREVIEW_PASSWORD = 'CrossubDemo2026!';

export function isDemoPreviewAccount(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === DEMO_PREVIEW_EMAIL;
}
