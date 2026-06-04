# crossub_mobile_tenant

Mobile-first **CROSSUB Tenant App** — workflow-driven tenant lifecycle portal. Consumes the [crossub_web](https://github.com/justin-crossub/crossub_web) API and aligns with the [crossub_mobile_agent](https://github.com/justin-crossub/crossub_mobile_agent) agent portal.

> Use **pnpm** only.

## Features (by MVP phase)

| Phase | Sections |
|-------|----------|
| **1** | Property search & apply, applications, onboarding (deposit/bond/lease/ingoing), lease |
| **2** | Maintenance, Communication Hub, rent receipts |
| **3** | Rent review, lease renewal, vacating & outgoing report, final statement |
| **4** | Direct debit, deeper AI, email integration (deferred) |

Demo lifecycle data is enabled by default (`NEXT_PUBLIC_USE_DEMO_DATA=true`) so UX can be reviewed before all tenant APIs exist on `crossub_web`.

## Apps

- `apps/tenant` — `@crossub/tenant`, Next.js 16 (port **3003** locally)

## Local development

```bash
cd crossub_mobile_tenant
pnpm install
cp apps/tenant/.env.example apps/tenant/.env   # or use the provided apps/tenant/.env

# Terminal 1 — API (crossub_web)
cd ../crossub_web && pnpm dev:api

# Terminal 2 — agent portal (optional, port 3002)
cd ../crossub_mobile_agent && pnpm dev:portal

# Terminal 3 — tenant app
pnpm dev
```

Open [http://localhost:3003](http://localhost:3003). Browse **Available properties** without login; sign in for dashboard and workflows.

## Environment variables

### `apps/tenant/.env` (local)

| Variable | Example | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | `/api` | Browser API base (same-origin proxy) |
| `API_INTERNAL_URL` | `http://localhost:3001` | Server proxy → crossub_web Nest API |
| `NEXT_PUBLIC_WEB_URL` | `http://localhost:3000` | Staff web (optional links) |
| `NEXT_PUBLIC_AGENT_PORTAL_URL` | `http://localhost:3002` | Agent portal (optional links) |
| `NEXT_PUBLIC_USE_DEMO_DATA` | `true` | Mock lifecycle (build-time) |
| `TENANT_USE_DEMO_DATA` | `true` | Mock lifecycle (runtime on server — no rebuild to toggle) |

### Render (tenant Web Service)

Set in Render → **Environment**:

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=/api
API_INTERNAL_URL=https://your-crossub-api.onrender.com
NEXT_PUBLIC_WEB_URL=https://your-crossub-web.onrender.com
NEXT_PUBLIC_AGENT_PORTAL_URL=https://crossub-mobile-agent.onrender.com
NEXT_PUBLIC_USE_DEMO_DATA=true
TENANT_USE_DEMO_DATA=true
```

Use `true` while reviewing the app with mock tenancy (12 River Lane, repairs, messages, etc.). Set both to `false` when tenant lifecycle APIs return real data per user.

`TENANT_USE_DEMO_DATA` applies on the **next page load** without rebuild. `NEXT_PUBLIC_USE_DEMO_DATA` still requires a **rebuild** if you change it.

### Demo data missing or accounts sharing the same data?

- **API login** (`system@crossub.com.au`): needs `TENANT_USE_DEMO_DATA=true` (or `NEXT_PUBLIC_USE_DEMO_DATA` at build). Local **Register** accounts never get demo tenancy (empty until they apply).
- **Register** creates a fresh store per `tenant-*` user id. Old browser data may linger under `crossub_tenant_data_v1` (legacy) — clear site data or use a private window.
- Sign out, then in DevTools → Application → Local Storage, delete keys starting with `crossub_tenant_data_v1`.

Replace URLs with your deployed services. Do **not** add `/api` to `API_INTERNAL_URL`.

### Render (crossub_web API — after tenant deploy)

Add the tenant app origin for password-reset / invite emails and CORS if needed:

```bash
# If you add a dedicated tenant URL env in API later:
TENANT_WEB_URL=https://crossub-mobile-tenant.onrender.com

CORS_ORIGINS=https://crossub-mobile-tenant.onrender.com,https://crossub-mobile-agent.onrender.com,https://crossub-web.onrender.com
```

Leave `COOKIE_DOMAIN` empty so auth cookies bind to each app hostname.

## Deploy on Render

1. Deploy **crossub_web** API first; note its URL.
2. Push this repo → Render → **New** → **Blueprint** → connect repo (`render.yaml`).
3. Set **`API_INTERNAL_URL`** when prompted (no trailing slash).
4. Optionally set `NEXT_PUBLIC_AGENT_PORTAL_URL` and `NEXT_PUBLIC_WEB_URL`.
5. Verify: `https://crossub-mobile-tenant.onrender.com/login`

**Manual Web Service** (if not using Blueprint):

| Setting | Value |
|---------|--------|
| Build Command | `corepack enable && pnpm install && pnpm build:tenant` |
| Start Command | `pnpm --filter @crossub/tenant start` |
| Health check | `/login` |

If Render still has the **agent portal** commands (`build:portal` / `start:portal`), either update them to `build:tenant` / `start:tenant`, or push this repo — root `package.json` includes `build:portal` → `build:tenant` aliases for compatibility.

## Integration map

```
crossub_web (API :3001)
    ↑ proxy /api
crossub_mobile_tenant (:3003)  ← tenant workflows
crossub_mobile_agent (:3002)   ← agent workflows (same API)
```

Maintenance requests can post to `/maintenance/requests` when authenticated and demo mode is off. Other modules use demo data until dedicated tenant endpoints are added on `crossub_web`.

## Build

```bash
pnpm build:tenant
```
