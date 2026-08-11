# Changelog

## 2026-08-11

### Fixed
- **An expired session told the tenant their internet was broken.** The Property screen resolved its empty-state copy through `apiConnected` and `profileUnlinked`, and those two flags describe three outcomes, not four: `apiConnected` is only true when *at least one* of the fifteen bootstrap fetches resolves, and `profileUnlinked` only flips on a **403**. A **401** — a missing or stale token, the single most likely reason every call fails at once — matched neither, so it fell through to the last branch: *"Could not reach the CROSSUB API. Check that the tenant app can reach the API…"*. Found on a real report where the API was provably fine: all fifteen tenant facade routes answered 401 to an unauthenticated probe, the app's own `/api/[...path]` proxy returned the upstream response verbatim, and the account had signed in successfully thirty seconds before the screenshot. **The message sent the only person who could fix it to look at the one thing that was working.** A new `sessionExpired` flag — set when the run saw a 401, saw no 403, and nothing connected — now carries that case, and the screen says the session expired and to sign in again. **403 deliberately wins over 401** where both appear: an unlinked profile is the more specific problem, and re-signing-in would not fix it. `isUnauthorizedRejection` matches on **status code only**, unlike `isForbiddenRejection` which also sniffs message text — our 403 carries a recognisable sentence from our own API, whereas the word "unauthorized" turns up in plenty of unrelated prose, and a false positive here would tell a tenant with a genuine outage to sign in again forever. The final fallback was reworded too: it no longer names an internal component ("the CROSSUB API") at a reader with no way to check one, and no longer tells them to sign in with "the email from your credentials email" as though the failure were their address. Same family as the `/forgot-password` stub below — a screen that reports the wrong cause is worse than one that reports nothing, because it makes the reader confidently do the wrong thing. **Not changed:** the bootstrap itself, which still fetches once and leaves each screen on seed data when its own call fails; making a 401 trigger a token refresh and retry is the real repair and is a larger change than a copy fix.
- **A tenant who cannot get in can now let themselves back in.** `/forgot-password` was a static paragraph — *"Password reset is handled by crossub_web. Contact your property manager or use the email link when reset is enabled on your API environment"* — with no field and no request, while `POST /api/auth/forgot-password` was public, live, and already correct. The page now takes an email and calls it, mirroring the agent portal's screen. Raised as a P0 ("tenant unable to log in") and diagnosed from the production Comm Hub: the login path was never broken. On 11 Aug, **1,470 of 1,569 production tenant accounts were `PENDING_INVITE`** — provisioned on 10 Aug with an emailed setup link, no password ever set — and such an account answers *every* password with 401, which this app renders as "Invalid email or password", indistinguishable from a typo. The one recovery route then told them to ask their property manager, who had no button either. Five tenants quoted that paragraph back to support verbatim, two with screenshots. The API side needs nothing: `AuthService.forgotPassword` deliberately re-sends a fresh **setup** link to a `PENDING_INVITE` user rather than staying silent, so one screen closes the whole loop. The confirmation copy names no expiry, because a setup link (72h) and a reset (24h) differ and naming either would tell the reader which they got — i.e. whether the address already has a password, which the API's identical-response design exists to hide. No `/reset-password` route was added: the emailed link lands on crossub_web's public reset page, and that stays the one place a password is set.
- **The sign-in form no longer rejects a correct password before sending it.** `loginSchema` enforced `.min(PASSWORD_MIN)` — 10 characters — on the *login* field, so an account whose password predates the policy greyed out with "Min 10 characters" under credentials that were perfectly valid, in the browser, without the API ever seeing the attempt. `LoginDto` dropped this exact rule on 10 Aug after it locked out 23 of the 43 migrated agent logins, and `login-dto-validation.spec.ts` pins it there; the agent app's copy was fixed alongside it and this one was missed. Signing in verifies a password, it does not set one — the minimum still applies on every screen that sets one. `.max(PASSWORD_MAX)` stays, as a cost guard on what reaches Argon2. **The inspector, landlord and maintenance apps still carry the same `.min(PASSWORD_MIN)` on their login forms and are unfixed.**

### Changed
- **The sign-in screen stopped describing a handover that never happened.** It read "Use the email and password your agent gave you after your lease was set up"; nobody was given a password — accounts were provisioned with an emailed setup link most people have never opened. It now names the email address to use and points at the recovery link, and that link reads "Set or reset my password" rather than "Forgot password?", which the majority of these tenants have not got to forget.

## 2026-08-01

### Fixed
- **The tenant is no longer told their outgoing report does not exist.** Following "Review outgoing report" from the End of lease screen landed on **"Report not found."** on a case whose detail endpoint answers 200 with a `reportUrl` and whose list reports it as `confirmed`. Two faults, one after the other. First, the detail fetch was gated on `apiConnected`, which the provider only sets at the end of its full refresh — arriving from End of lease renders before that completes, so the fetch was skipped entirely and the page fell straight through to the not-found branch; confirmed live, `/v1/tenant/outgoing-inspections/<id>` was never requested once across 80 API calls on that route. Second, once the fetch was ungated, the effect derived its dependencies from the very state it set, so React tore the effect down and cancelled the request before it resolved: the detail came back 200 and was thrown away, leaving the empty list summary on screen with no sections. The effect now depends only on the id (plus an explicit retry), fetches once, and keeps showing "Loading report…" until that attempt actually finishes. Because the API client throws a bare `Error` with no status, a missing report and a failed request are indistinguishable here, so the failure copy no longer asserts non-existence — it says the report could not be loaded and offers Try again.

- **A self-inspection no longer loses photos the tenant has already taken.** Each section uploads on its own, so two uploads routinely resolve between renders — and the per-section handler rebuilt the area's whole `photosBySection` map from the render-time `issues` before handing it over as a patch. Whichever upload finished second therefore spread a map that did not contain the first one's photo and erased it. Nothing told the tenant: the upload itself had succeeded, so the section simply sat empty, and the only thing that caught it was the "Next area" validation refusing to advance. Reproduced twice while driving a real routine inspection — 3 of 8 photos dropped in one area, 2 of 8 in another. `updateIssue` now takes a function and every derived write reads the previous state inside the updater, which closes the same hole in add-section, remove-section and the availability gate as well.

## 2026-07-31

### Fixed
- **The ingoing acknowledgement screen is reachable again.** Every inspection card linked straight to its report PDF, so the confirm/dispute/approve flow at `/inspections/ingoing/:id` — the screen the card's own subtitle promises, "confirm each section" — could not be opened from anywhere in the app. A tenant could read their condition report but never sign it, and the case sat at "awaiting confirmation" indefinitely. Ingoing cards whose report is still waiting on the tenant now open that screen; settled ones still open the PDF, since at that point they are just a record.

## 2026-07-30

### Added
- **A tenant who disagreed can now end the dispute themselves.** Disagreeing parks the case with the property manager instead of closing it, which left the tenant able to open a dispute and never finish it — no button, no way back. The repair now carries an "I accept this — close the case" card once a disagreement is on file, and taking it closes the case exactly as agreeing first time would. Deliberately not a fixed bottom bar like the acknowledgement prompt: this is an option for whenever the two of them settle it, not a demand for an answer.

### Fixed
- **A repair that had since been closed still read "Under review — you disagreed", and offered an accept-and-close button that could never work.** Once a disagreement was on file the status mapping returned it unconditionally, outranking the fact that the case had ended — so a dispute the property manager had already ruled on and closed still presented as live, and because that override also kept the repair from counting as finished, the "I accept this — close the case" card stayed on screen. Tapping it asked the API to close an already-closed case, which it correctly refused. A finished case now reads as finished, with a line noting the manager reviewed the reason given.
- **The API's reason for refusing a responsibility answer now reaches the tenant.** Every failure of that call — case already closed, answer already recorded, reason required — arrived as the same "Failed to record maintenance responsibility response", discarding a message the API wrote for a person to read. The tenant had nothing to act on, and from the outside the cause was invisible. Both maintenance decision calls (responsibility answer, completion approval) now surface the API's own words via the existing `throwTenantApiError`. The other 39 calls in that client still throw generic messages.
- **An open conversation now shows a new message as it arrives.** A reply typed by an officer in the staff console only appeared after leaving the thread and coming back. The screen rendered whatever the provider's background tick had last fetched and did nothing itself — so it depended on a timer it could not see, one that is gated on `apiConnected` and torn down whenever auth state moves. The thread now pulls when it opens and on the shared cadence while it stays open, and pauses when the tab is hidden.
- Repairs (`/repairs`) — two old jobs sat above everything else and a repair filed minutes earlier appeared third, under them. `fetchMaintenanceRequests` read only the first page of a paged endpoint (20 of the tenant's 28 jobs) and discarded `total`/`hasMore`, so it never knew the list was cut short. The provider then treated "not in the response" as "created locally, keep it" and concatenated those leftovers **in front** of the API rows — so every repair that slipped past page one was pinned to the top of the screen and frozen at its last-seen status and progress, unable to ever update again.
- The maintenance list is now read to the end (`pageSize=100`, following `hasMore`), so the tenant's whole history is present and current.
- Rows the API does not return are kept only while their id is still a local one, and the merged list is always sorted newest-first — the persisted snapshot is sorted on load too, so the first paint after this upgrade already shows the right order rather than the order an older build wrote.
- **Every other paged tenant list was truncating at 20 the same way** — `fetchTenancies`, `fetchLedger`, `fetchTenantProperties`, `fetchTenantInspections` and `fetchTenantApplications` all read `data.items` from one unparameterised call. The rent ledger was the one due to break next: a weekly tenancy passes 20 entries in five months, after which the oldest payments would simply have stopped appearing, with no empty state or "load more" to hint that anything was missing. All five now read to the end.
- Verified nothing else truncates: the remaining tenant list facades (`documents`, `messages`, `notifications`, `rent-reviews`, `vacating-cases`, `new-leasing`, the three inspection lists) return bare arrays with no pagination, and `GET /public/listings` is unpaged.

### Added
- `lib/crossub-api/paged.ts` — `collectPages`, the one paging loop all six list fetches share.
- `constants/paged-list.ts` — `LIST_PAGE_SIZE` (100, the API's cap) and `LIST_MAX_PAGES` (a stop so a wrong `hasMore` cannot spin forever).
- `lib/maintenance-request-filters.ts` — `isLocalMaintenanceRequest`, `sortMaintenanceRequestsNewestFirst`, `mergeMaintenanceRequests` (the merge both sync paths now share).
- `constants/maintenance-request.ts` — the local-id prefix.

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
