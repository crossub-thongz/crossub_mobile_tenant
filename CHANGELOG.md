# Changelog

## 2026-07-30

### Fixed
- Repairs (`/repairs`) — two old jobs sat above everything else and a repair filed minutes earlier appeared third, under them. `fetchMaintenanceRequests` read only the first page of a paged endpoint (20 of the tenant's 28 jobs) and discarded `total`/`hasMore`, so it never knew the list was cut short. The provider then treated "not in the response" as "created locally, keep it" and concatenated those leftovers **in front** of the API rows — so every repair that slipped past page one was pinned to the top of the screen and frozen at its last-seen status and progress, unable to ever update again.
- The maintenance list is now read to the end (`pageSize=100`, following `hasMore`), so the tenant's whole history is present and current.
- Rows the API does not return are kept only while their id is still a local one, and the merged list is always sorted newest-first — the persisted snapshot is sorted on load too, so the first paint after this upgrade already shows the right order rather than the order an older build wrote.

### Added
- `lib/maintenance-request-filters.ts` — `isLocalMaintenanceRequest`, `sortMaintenanceRequestsNewestFirst`, `mergeMaintenanceRequests` (the merge both sync paths now share).
- `constants/maintenance-request-list.ts` — local-id prefix plus the list's page size and page cap.

## 2026-07-29

### Changed
- **Disagreeing with a tenant-responsibility decision now asks for a reason before it closes the case** (officer ask, demo feedback). The red "I disagree" used to submit on the first tap: the job closed instantly and the officer's notification email arrived saying only that the tenant disagreed, with nothing to follow up on. It now opens a required reason box with Cancel / Submit disagreement, and submit stays disabled until at least `MIN_RESPONSIBILITY_DECLINE_REASON_LENGTH` characters are typed (mirrors the API's `@MinLength(3)`, so the tenant is told before the request goes out rather than after a 400 comes back). The reason was already plumbed through the provider and the API DTO — the screen was the only thing never sending it.
- New `constants/maintenance-responsibility.ts` holds the min/max reason lengths.

### Fixed
- Message thread (`/messages/[id]`), inbox previews and notifications rendered API bodies verbatim, so the email portal CTA the API appends at send time (`<p style="…"><a class="crossub-email-cta" …>Open Tenant (Mobile)</a></p>`) showed as raw HTML at the end of every workflow message.
- Message and notification bodies lost their paragraph breaks and ran together as one block; bodies now render with `whitespace-pre-line`.

### Added
- `lib/message-body.ts` (`toPlainTextBody`) — projects the email-shaped API bodies onto plain text: drops the portal CTA button and its "Click below to open …" intro line, turns `<br>`/block tags into newlines, keeps other links as `label (url)`, decodes HTML entities. Applied in `lib/crossub-api/tenant-mappers.ts` to thread messages, thread previews, notifications and rent-review notice emails, and on rehydrate in `lib/tenant-data-state.ts` so previously persisted bodies clean up too.
- `constants/email-body.ts` — `EMAIL_CTA_MARKER`, block-tag list and HTML entity map (mirrors `crossub_web` → `apps/api/src/common/utils/email-cta.util.ts`).

## 2026-07-27

### Fixed
- Repair detail (`/repairs/[id]`) — the "Approve visit time" card stayed live after the tenant answered, so repeat taps re-triggered the contractor/agent notification email (reported by Angel on MR-00031). The card now becomes a read-only **Confirmed schedule** state on approve (showing the approved times and the confirmed visit datetime) and a **Visit time declined** state on decline; the action buttons never re-enable once a decision is recorded.
- The decision is persisted per request in `localStorage`, so the 5s `syncMaintenanceRequests` poll — which replaces API-backed rows wholesale and discarded the provider's optimistic `scheduleApprovalPending: false` — can no longer re-open the card, and neither can a page reload (tenants re-enter from the email link). Buttons stay disabled until that record is read, so the first paint after a reload cannot offer a stale action.

### Added
- `lib/maintenance-schedule-decision.ts` — durable per-request record of the tenant's visit-time decision, stamped with the proposal round so new contractor times correctly re-arm the card.
- `constants/maintenance-schedule.ts` (`SCHEDULE_DECISION`) and `constants/maintenance-status.ts` (`MAINTENANCE_TENANT_STATUS`, `MAINTENANCE_TENANT_FINISHED_STATUSES`) — runtime constants replacing raw `'approved'`/`'declined'`/`'completed'` string comparisons.

## 2026-07-03

### Fixed
- `lib/onboarding-payment-copy.ts` — the `deposit`/`bond` copy entries were missing the `summary` (both) and `faq` (bond) fields the onboarding step page renders, breaking `tsc`. Both entries now carry the full shape; the deposit-vs-bond explainer moved from bond's instruction bullets into its FAQ box (question/answer), matching how the page presents it. App `tsc --noEmit` is now clean. (Copy remains flagged for confirmation with Leasing/Fay.)

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
