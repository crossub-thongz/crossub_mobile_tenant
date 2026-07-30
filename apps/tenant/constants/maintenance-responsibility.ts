/**
 * Tenant answer to a tenant-responsibility decision
 * (`PATCH /tenant/maintenance-requests/{id}/responsibility-ack`).
 *
 * Agreeing closes the case. Disagreeing PARKS it with the property manager, which is why it is a
 * two-step action in the UI rather than one tap on a red button: before this, "I disagree" closed
 * the job instantly and the officer's notification email read "No reason was provided", leaving
 * nothing to follow up on.
 */

/**
 * Shortest reason the API will accept on a disagreement (`@MinLength(3)` on
 * `TenantMaintenanceResponsibilityAckDto.reason`). Checked here too so the tenant is told
 * before the request goes out, not after it comes back 400.
 */
export const MIN_RESPONSIBILITY_DECLINE_REASON_LENGTH = 3;

/** Matches the API's `@MaxLength(2000)` — the textarea stops there rather than being truncated. */
export const MAX_RESPONSIBILITY_DECLINE_REASON_LENGTH = 2000;

/**
 * Ending a dispute the tenant opened.
 *
 * The API lets an agreement OVERTURN an earlier refusal (the reverse is not allowed — agreement is
 * final), so this is the tenant's own way to close a parked case once they and the property manager
 * have settled it. Says plainly that accepting closes the case, because it does.
 */
export const RESPONSIBILITY_ACCEPT_AFTER_DISPUTE_CTA = 'I accept this — close the case';
export const RESPONSIBILITY_DISPUTE_OPEN_NOTE =
  'This case is still open with your property manager while they review your reason. ' +
  'If you have since agreed with them that this is yours to fix, you can accept the decision ' +
  'here and the case will close.';
