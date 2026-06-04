/** Locally registered tenants (device signup) — not agency API users. */
export function isLocalRegisteredUser(userId: string | null | undefined): boolean {
  return Boolean(userId?.startsWith('tenant-'));
}

export function shouldShowDemoTenancy(
  userId: string | null | undefined,
  authed: boolean,
  demoEnv: boolean,
): boolean {
  if (!authed || !userId) return false;
  if (isLocalRegisteredUser(userId)) return false;
  return demoEnv;
}
