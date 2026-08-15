# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The CROSSUB **tenant** mobile-web app (Next.js 16 App Router, React 19, Tailwind v4).
pnpm workspace: `apps/tenant` (`@crossub/tenant`, port **3003**) + `packages/api-contract`.
One of five role apps; the backend and the other four apps are **sibling repos** under
`~/Desktop/crossub/`.

## Commands

```bash
pnpm dev                       # apps/tenant on :3003
pnpm build:tenant              # builds the contract package first, then next build
pnpm build                     # next build ONLY — skips the contract build, usually wrong
pnpm start                     # next start -H 0.0.0.0

cd apps/tenant && ./node_modules/.bin/tsc --noEmit    # the real correctness gate
```

- **`next build` does not typecheck** — `next.config.mjs` sets `typescript.ignoreBuildErrors: true`.
  A green build means nothing; run `tsc --noEmit` after any change.
- **`pnpm lint` is broken** — the `lint` script runs `eslint .` but eslint is neither a
  dependency nor configured. Don't rely on it; don't cite it as a check.
- **No test suite exists.** Verify by typechecking and running the app.
- Local dev needs the Nest API from `crossub_web` running on :3001 (`pnpm dev:api` there).

## The API contract is the source of truth

The app never hand-writes request/response types. Everything comes from
**`@crossub-thongz/api-contract`** — generated from the NestJS API's OpenAPI
(`openapi.mobile.json`, the `/api/v1` facades only).

- Typed client: `apps/tenant/lib/crossub-api/client.ts` — `createCrossubClient`
  (openapi-fetch, base `${NEXT_PUBLIC_API_URL}/v1`, cookie session via `credentials: 'include'`).
- Add new calls in `apps/tenant/lib/crossub-api/*` using the `crossub` client and
  `components['schemas'][...]` types. A backend change should surface as a TypeScript
  error, not a runtime surprise.

### Two copies of the contract — know which one resolves

`apps/tenant/package.json` declares `"@crossub-thongz/api-contract": "workspace:*"`, so it
resolves to the **checked-in `packages/api-contract/`** in this repo — a synced snapshot of
`crossub_web/packages/api-contract` (the canonical generator, currently ahead of the copy here).
The published GitHub Packages tarball is only used by repos that don't vendor it.

Consequences worth knowing before debugging type errors:

- TypeScript reads the package's **built `dist/index.d.ts`** (`dist/` is gitignored), so the
  contract must be built for types to be current — that's what `pnpm build:tenant` does and
  plain `pnpm build` does not.
- `apps/tenant/node_modules/@crossub-thongz/api-contract` can be a **stale symlink to a
  published `0.10.0` tarball** left over from before the workspace switch. When that's the
  case `tsc --noEmit` reports dozens of "Property `Tenant…Dto` does not exist" and
  "not assignable to `PathsWithMethod`" errors even though `packages/api-contract/src/types.ts`
  defines them. Fix by reinstalling and building the contract, not by editing call sites.
- `.npmrc` points the `@crossub-thongz` scope at GitHub Packages and expects `GITHUB_TOKEN`
  in the environment; without it `pnpm install` warns (and would fail if it had to fetch).

**Updating the contract:** regenerate in `crossub_web` (`pnpm --filter @crossub/api contract`),
then sync `src/types.ts` + `openapi*.json` into `packages/api-contract/` here (and bump/publish
if the other apps need it).

## Request path & auth

```
browser → /api/v1/*  →  apps/tenant/app/api/[...path]/route.ts  →  ${API_INTERNAL_URL}/api/v1/*
```

- The catch-all BFF proxy forwards every method, strips `Domain=` from `Set-Cookie` and drops
  `Secure`/downgrades `SameSite=None` on localhost so the httpOnly `csb_at` session cookie binds
  same-origin. `maxDuration = 300` for slow payment-proof uploads.
- `app/api/v1/public/listings/[propertyId]/applications/route.ts` is a **second, explicit proxy**
  for guest applications (large base64 doc payloads, clearer 502 copy) — it bypasses the catch-all.
- `apps/tenant/proxy.ts` is the route guard (Next 16 `proxy`, i.e. middleware): `/` redirects to
  `/property` when the `csb_at` cookie exists and `/properties` otherwise; non-public routes bounce
  to `/login`; and a signed-in user hitting `/login` or `/forgot-password` is sent to `/property`
  **unless** the URL carries `?session=expired` (that escape hatch is what lets the expired-session
  redirect from `lib/api.ts` actually land). Public routes live in `PUBLIC_ROUTE_PATTERNS`
  (`constants/routes.ts`) — `/login`, `/forgot-password`, and the whole guest `/properties/*`
  applicant journey.
- `app/page.tsx` is **dead code**: it redirects to `ROUTES.DASHBOARD`, but the proxy resolves `/`
  first and never lets it render. The bottom nav's "Home" tab is what actually reaches `/dashboard`.
  Don't reason about the landing route from that file.
- `lib/api.ts` is the untyped fetch helper used for `/auth/*` and blob downloads. It
  single-flights `POST /auth/refresh` on 401 (parallel 401s must not rotate the refresh token
  twice) and, on failure, logs out and redirects to `/login?session=expired`.
- `AuthProvider` (`components/providers/auth-provider.tsx`) calls `GET /auth/me` and **rejects
  non-TENANT sessions** (`lib/tenant-auth.ts` → `/login?wrongPortal=1`), because admin web
  (:3000) and this app share the cookie on localhost.

## Data flow: one provider, many screens

`app/layout.tsx` wraps everything in `ThemeProvider → AuthProvider → TenantDataProvider` plus two
gates (`SystemAccessAgreementGate`, `OnboardingGuideGate`). Pages are `'use client'`, call
`useTenantData()` / `useAuth()`, and render — **screens do not fetch**.

The chain for any tenant feature:

1. `lib/crossub-api/tenant-account-client.ts` / `tenant-leasing-client.ts` /
   `public-listings-client.ts` — typed fetchers over the contract.
2. `lib/crossub-api/tenant-mappers.ts` — **pure** adapters from API DTOs to the app's
   view-model types in `lib/types.ts`. All shape/enum translation belongs here.
3. `components/providers/tenant-data-provider.tsx` (~1700 lines) — the single seam. `refresh()`
   fans out ~15 fetchers through `Promise.allSettled`, so one 403/outage degrades a single screen
   instead of blanking the app. It derives `apiConnected` (any fetcher succeeded) and
   `profileUnlinked` (nothing succeeded **and** something 403'd — a TENANT user with no
   Person/tenancy anchor yet); `components/tenant/connection-banner.tsx` renders the difference.
4. Pages read the context; mutations are optimistic and then reconciled by the next `refresh()`.

Adding a screen's data means touching 1–3, not the page.

**Live sync:** `LIVE_POLL_MS = 5s` (`lib/live-sync.ts`). Background timers re-poll *narrow* slices
(`syncLiveAttention`, `syncMaintenanceRequests`, `syncRoutineInspections`) plus a `visibilitychange`
listener — deliberately **not** full `refresh()`, which used to wipe lease state and flash the
property page. `lib/use-live-poll.ts` is the reusable hook.

**Local persistence:** `lib/tenant-store.ts` writes a `crossub_tenant_data_v1` localStorage blob;
`lib/tenant-data-state.ts` rehydrates it on load so optimistic writes survive a refresh. API
results generally **replace** persisted lists, except locally-created rows (repairs, threads),
which are merged ahead by id so a user's own submission never disappears mid-flight.

Demo/mock mode is **gone** — there is no `lib/mock-data.ts`, and nothing reads
`NEXT_PUBLIC_USE_DEMO_DATA` (it lingers only in `.env.example` and `render.yaml`). Comments
mentioning "demo seeds" are historical. Everything renders live API data.

**`README.md` is stale on this point** and states the opposite ("Demo lifecycle data is enabled by
default", `NEXT_PUBLIC_USE_DEMO_DATA=true`, "Other modules use demo data until dedicated tenant
endpoints are added"). None of that is true any more. The README's local-dev setup, env table and
Render deploy steps are still accurate — trust those, not its feature/demo claims.

## Conventions

- `constants/api-enums.ts` mirrors the API's Prisma enums as `as const` objects, because the
  contract ships them as string-literal *types* with no runtime values. Compare against these,
  never raw strings; keep in sync with `crossub_web/apps/api/prisma/schema.prisma`.
- `constants/routes.ts` owns `ROUTES` plus path builders (`repairDetail`, `routineInspection`,
  `propertyApply`, …) and the public/applicant route predicates. Don't inline route strings.
  Some keys are aliases kept for redirects (`MAINTENANCE → /repairs`, `PAYMENTS → /accounting`).
- Those aliases have **real page directories that are one-line `redirect()` stubs** —
  `app/maintenance/{,new,[id]}` and `app/payments/{,statement}`. The screens that matter are
  `app/repairs/*` and `app/accounting/*`. Grep hits in the alias dirs are almost always the
  wrong file to edit; check the line count first (a stub is ~7 lines).
- `constants/feature-flags.ts` is a real kill switch, not scaffolding: `APPLICATION_FORM_ENABLED`
  gates the NSW tenancy application wizard on `/properties/[id]/apply`. Set it `false` only to
  short-circuit to the open-inspection check-in–linked one-tap apply panel for testing.
- Shared logic lives in `apps/tenant/lib/*` as small single-purpose modules
  (`rent-calculations`, `ingoing-inspection`, `routine-inspection`, `end-leasing`,
  `back-navigation`, …). Prefer extending one of those over adding logic to a page.
- Layout: every screen renders inside `components/layout/tenant-shell.tsx` (mobile bottom nav,
  header, badge counts). Back links are built with `hrefWithFrom`/`resolveBackHref`
  (`lib/back-navigation.ts`).
- UI: Tailwind v4 via `@tailwindcss/postcss`, tokens as CSS variables in `app/globals.css`
  (light default, `.dark` class set before hydration by an inline script in `layout.tsx`).
  A handful of shadcn-style primitives live in `components/ui/`; toasts via `sonner`.
- `@/*` maps to `apps/tenant/*`.

## Environment

`apps/tenant/.env` (see `.env.example`): `NEXT_PUBLIC_API_URL=/api` (browser base, same-origin
proxy), `API_INTERNAL_URL=http://localhost:3001` (server → Nest API, **no** `/api` suffix), and
optional `NEXT_PUBLIC_WEB_URL` / `NEXT_PUBLIC_AGENT_PORTAL_URL` link targets. Deployment is Render
(`render.yaml`, build `pnpm build:tenant`, health check `/login`).
