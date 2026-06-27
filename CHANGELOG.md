# Changelog

## 2026-06-27

### Added
- Typed read path for the tenant API: `lib/crossub-api/tenant-mappers.ts` (DTO → view-model adapters), a `fetchMaintenanceRequests()` list fetcher in `lib/crossub-api/tenant-account-client.ts`, and `constants/api-enums.ts` mirroring the contract's Prisma enums.

### Changed
- Lease, Property, Accounting and Repairs screens render live API data (`/api/v1/tenant/{tenancies,ledger,maintenance-requests}`) when signed in, with per-domain fallback to demo seeds on error; data flows through the `TenantDataProvider` refresh seam so no screen component changed.

### Removed
- Legacy `fetchMaintenanceState()` (`/maintenance/state`) read path from `lib/crossub-api/maintenance-client.ts`, replaced by the typed v1 fetchers.
- Parallel tenant-account backend: the `app/api/tenant-accounts/*` routes and `lib/tenant-accounts-server.ts` (a local JSON store that held plaintext passwords and was ephemeral on Render). Tenant accounts are now real CROSSUB API users (Argon2-hashed), provisioned by the agent portal via `POST /api/v1/agent/tenants` and signed in through the API's `/auth/login`.
- The `loginProvisionedAccount` fallback from the sign-in flow (`lib/local-auth.ts`, `app/login/page.tsx`); login already tries the real API first.
