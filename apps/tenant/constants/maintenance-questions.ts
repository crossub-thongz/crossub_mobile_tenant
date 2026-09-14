/**
 * Answering the questions CROSSUB asked about a repair
 * (`PATCH /tenant/maintenance-requests/{id}/answers`).
 *
 * When the maintenance AI can't decide a repair from the tenant's report, it stores a few short
 * questions per issue and staff send them to the tenant. The tenant answers here; the API records
 * the answers and re-runs the triage so the job can move. Absent/empty questions mean nothing to
 * answer — the card is only shown when at least one question is still unanswered.
 */

/**
 * Longest answer the API will accept per question (`@MaxLength(2000)` on
 * `MaintenanceIssueAnswerDto.answer`). The textarea stops there rather than being truncated on
 * the round-trip.
 */
export const MAX_MAINTENANCE_ANSWER_LENGTH = 2000;

/** UI copy for the "Questions about this repair" card, kept beside the other maintenance cards. */
export const MAINTENANCE_QUESTIONS_CARD_TITLE = 'Questions about this repair';
export const MAINTENANCE_QUESTIONS_CARD_HINT =
  'Your answers help us decide who handles this and send the right tradesperson.';
export const MAINTENANCE_QUESTIONS_SUBMIT_CTA = 'Send answers';
export const MAINTENANCE_QUESTIONS_SUBMIT_SUCCESS =
  "Thanks — we've passed your answers on.";
export const MAINTENANCE_QUESTIONS_SUBMIT_FALLBACK_ERROR =
  'Could not send your answers. Try again.';

/** Short line on the repair's list card so the tenant finds the unanswered questions. */
export const MAINTENANCE_QUESTIONS_LIST_BADGE = 'Questions waiting for you';
