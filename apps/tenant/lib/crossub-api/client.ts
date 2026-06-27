import { createCrossubClient } from '@crossub-thongz/api-contract';

/**
 * Typed CROSSUB mobile-contract client for the tenant app.
 *
 * Same-origin: the browser calls the BFF proxy at /api/v1/* (app/api/[...path]/route.ts),
 * which forwards to the Nest API carrying the httpOnly `csb_at` session cookie — so we
 * authenticate with the existing cookie session, no bearer token needed. Every path,
 * param, body and response is typed from `@crossub-thongz/api-contract` (openapi.mobile.json),
 * so a backend change that breaks this app surfaces as a TypeScript error.
 */
const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/v1`;

export const crossub = createCrossubClient({
  baseUrl: API_BASE,
  credentials: 'include',
});
