# CROSSUB Tenant App — CLAUDE.md

The CROSSUB tenant mobile-web app (Next.js 16; the app itself is in `apps/tenant/`).
One of five role apps; the other apps and the backend live in **sibling repos** under
`~/Desktop/crossub/`.

## The API contract is the source of truth

This app talks to the backend through the **published contract**, never hand-written
clients or types:

- Package: **`@crossub-thongz/api-contract`** — generated from the NestJS API's OpenAPI
  (`openapi.mobile.json`, the `/api/v1` facades only).
- Typed client: `apps/tenant/lib/crossub-api/client.ts` — `createCrossubClient`
  (openapi-fetch, base `/api/v1`, cookie session via `credentials: 'include'`).
- Add new calls in `apps/tenant/lib/crossub-api/*` using the `crossub` client and the
  contract's `components['schemas'][...]` types. **Never hand-roll request/response types** —
  a backend change should surface here as a TypeScript error, not a runtime surprise.

## Where things live (sibling repos under `~/Desktop/crossub/`)

- **Backend (NestJS):** `crossub_web/apps/api`. The tenant uses the `/api/v1/tenant/*`,
  `/api/v1/me`, and `/api/v1/auth/*` facades.
- **Contract source:** `crossub_web/packages/api-contract` — wired into this session via
  `.claude/settings.json` → `additionalDirectories`, so the live contract types are in
  context without opening the whole backend or the other four apps.

## Auth & data flow

- Cookie session (`csb_at`) is obtained at `/auth/login`; every API call goes through the
  BFF proxy `apps/tenant/app/api/[...path]/route.ts` → `API_INTERNAL_URL`.
- `NEXT_PUBLIC_USE_DEMO_DATA=true` renders mock data (`lib/mock-data.ts`); set it to
  `false` to use the real API.

## Updating the contract

When the backend's tenant facade changes, regenerate + republish from `crossub_web`
(`pnpm --filter @crossub/api contract`, then bump + publish the package), then bump
`@crossub-thongz/api-contract` here.
