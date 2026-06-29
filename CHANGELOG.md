# Changelog

## 2026-06-29

### Changed
- Bumped `@crossub-thongz/api-contract` dependency `^0.1.0` → `^0.10.0` (the published contract that now carries the full tenant operational surface). With the source-fixed nullable DTOs, the contract types are `T | null` (not `T | Record<string, never>`), so the mapper `asString`/`asNumber` guards are now belt-and-suspenders. **This completes the tenant app's move off mock — all 5 CROSSUB mobile apps are now operationally off mock.**

### Added
- Tenant-account client: `fetchTenantInspections`, `fetchTenantDocuments`, `fetchTenantApplications`, `fetchTenantRentReviews` + `fetchTenantNotifications`, `markTenantNotificationRead`, `markAllTenantNotificationsRead` (`/api/v1/tenant/{inspections,documents,applications,rent-reviews,notifications}`).
- `tenant-mappers.ts`: `toTenantInspections`, `toTenantDocuments`, `toTenantApplications` (→ `RentalApplication[]`), `toTenantRentReviews` (→ `RentReviewCase[]`), `toTenantNotifications`; `constants/api-enums.ts` gains `INSPECTION_TYPE`, `INSPECTION_STATUS`, `APPLICATION_STATUS`, `RENT_REVIEW_WORKFLOW_STATE`, `TENANT_NOTIFICATION_TYPE`.

### Changed
- Applications render live data: the list is loaded from `GET /tenant/applications` on refresh (the apply SUBMIT flow stays local — read-only).
- Rent reviews render live data: `GET /tenant/rent-reviews` populates the rent-review screens (current/proposed rent, effective date, explanation, status); the accept/dispute/counter actions stay local (read-only).
- Inspections render live data: the list is loaded from `GET /tenant/inspections` on refresh (type/status mapped to the app's view-model; a published report opens its PDF). The ingoing/outgoing confirmation flows stay local (read-only).
- Documents render live data: `My documents` lists the aggregated property documents from `GET /tenant/documents` (inspection/maintenance/lease PDFs) when signed in, replacing the derived demo list; demo mode keeps the derived list.
- Notifications render live data: the list is loaded from `GET /tenant/notifications` on refresh, and tapping a notification marks it read against the real `PATCH /tenant/notifications/:id/read` (optimistic, with fallback to demo seeds on error). No screen component changed (the `TenantDataProvider` refresh seam + mappers do the work). Demo mode still uses the local seed/store.

## 2026-06-28

### Added
- `fileToBase64` in `lib/utils.ts` (reads a File to raw base64 for the photo upload).
- Tenant-account client: `uploadMaintenancePhoto` + `uploadRepairPhotos` (stage repair photos to R2 before create), `submitMaintenanceRequest` (the typed contract writer), and the messaging fns `fetchTenantMessages` / `createTenantMessageThread` / `replyToTenantMessageThread`.
- `tenant-mappers.ts`: `toMessageThreads` (API threads → `MessageThread[]` + per-thread `ThreadMessage[]`) and `categoryToDepartment`; `constants/api-enums.ts` gains `COMM_DEPARTMENT` + `COMM_CHANNEL`.

### Changed
- New repair screens (`repairs/new`, `maintenance/new`) now submit through the typed v1 writer `POST /tenant/maintenance-requests` and upload photos first via the staging endpoint (a failed upload blocks the submit so evidence is never lost); the optimistic card reuses the server id/order number so the next refresh reconciles cleanly.
- Messages render live data: the inbox, each thread's history, compose, and reply all flow through `/api/v1/tenant/messages` when signed in, with optimistic writes reconciled via `serverThreadId` and per-domain fallback to demo seeds on error. No screen component changed (the `TenantDataProvider` refresh seam + mappers do the work). Demo mode still uses the local seed/store.

### Removed
- Legacy `lib/crossub-api/maintenance-client.ts` (the bypassed `POST /maintenance/requests` writer the new-repair screens used) — replaced by the typed v1 tenant writer.

## 2026-06-27

### Added
- Typed read path for the tenant API: `lib/crossub-api/tenant-mappers.ts` (DTO → view-model adapters), a `fetchMaintenanceRequests()` list fetcher in `lib/crossub-api/tenant-account-client.ts`, and `constants/api-enums.ts` mirroring the contract's Prisma enums.

### Changed
- Lease, Property, Accounting and Repairs screens render live API data (`/api/v1/tenant/{tenancies,ledger,maintenance-requests}`) when signed in, with per-domain fallback to demo seeds on error; data flows through the `TenantDataProvider` refresh seam so no screen component changed.

### Removed
- Legacy `fetchMaintenanceState()` (`/maintenance/state`) read path from `lib/crossub-api/maintenance-client.ts`, replaced by the typed v1 fetchers.
- Parallel tenant-account backend: the `app/api/tenant-accounts/*` routes and `lib/tenant-accounts-server.ts` (a local JSON store that held plaintext passwords and was ephemeral on Render). Tenant accounts are now real CROSSUB API users (Argon2-hashed), provisioned by the agent portal via `POST /api/v1/agent/tenants` and signed in through the API's `/auth/login`.
- The `loginProvisionedAccount` fallback from the sign-in flow (`lib/local-auth.ts`, `app/login/page.tsx`); login already tries the real API first.
