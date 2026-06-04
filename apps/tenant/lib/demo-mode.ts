/**
 * Demo lifecycle (12 River Lane, repairs, messages, etc.)
 *
 * - NEXT_PUBLIC_USE_DEMO_DATA — baked in at build time
 * - TENANT_USE_DEMO_DATA — read on the server each request (change on Render without rebuild)
 */
export function resolveUseDemoData(runtime?: { useDemoData?: boolean }): boolean {
  if (runtime?.useDemoData === true) return true;
  if (runtime?.useDemoData === false) return false;
  return process.env.NEXT_PUBLIC_USE_DEMO_DATA !== 'false';
}
