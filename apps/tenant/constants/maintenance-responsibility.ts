/**
 * Tenant answer to a tenant-responsibility decision
 * (`PATCH /tenant/maintenance-requests/{id}/responsibility-ack`).
 *
 * Either answer closes the case, which is why disagreeing is a two-step action in the UI rather
 * than one tap on a red button: before this, "I disagree" closed the job instantly and the
 * officer's notification email read "No reason was provided", leaving nothing to follow up on.
 */

/**
 * Shortest reason the API will accept on a disagreement (`@MinLength(3)` on
 * `TenantMaintenanceResponsibilityAckDto.reason`). Checked here too so the tenant is told
 * before the request goes out, not after it comes back 400.
 */
export const MIN_RESPONSIBILITY_DECLINE_REASON_LENGTH = 3;

/** Matches the API's `@MaxLength(2000)` — the textarea stops there rather than being truncated. */
export const MAX_RESPONSIBILITY_DECLINE_REASON_LENGTH = 2000;
