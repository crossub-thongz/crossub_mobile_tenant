/**
 * Rent-review scheduling rules — CRS-0082.
 *
 * Mirrored from the API's `rent-review.constants.ts` so the tenant app and the agent
 * registry put the same day on screen. Keep in sync with
 * `crossub_web/apps/api/src/constants/rent-review.constants.ts`.
 */

/**
 * NSW allows one rent increase in any twelve-month period, counted from the day the rent
 * was last set — the last increase, or the lease start when there has not been one.
 */
export const RENT_REVIEW_CYCLE_YEARS = 1;

/**
 * Days before the increase may take effect that the review order opens: sixty days of
 * statutory tenant notice plus twenty to run the review.
 */
export const RENT_REVIEW_ADVANCE_ORDER_DAYS = 80;

/**
 * What the tenant's response card says (Daniel Zhou, 17 Sep 2026 — "Rent review step TENANT
 * side update"). The words are the product here: they tell a tenant what each button commits
 * them to, so they live together rather than inline in the panel.
 *
 * `DISPUTE_BODY` is information only. Tapping Dispute records nothing and notifies nobody — it
 * tells the tenant that NCAT exists and that time limits apply, which is the agency's duty to
 * say and not a step in this workflow.
 */
export const RENT_REVIEW_RESPONSE_COPY = {
  HEADING: 'Your response',
  INTRO:
    'Submit your response to the proposed rent increase. Your property manager will be notified immediately. If you accept a fixed-term renewal, the lease extension agreement is sent separately for signature afterward.',
  ACCEPT: 'Acknowledge and accept the increase',
  REQUEST_REVIEW: 'Request a review',
  /** A tenant who has already asked once is answering an offer, not opening the conversation. */
  REQUEST_REVIEW_AGAIN: 'Submit',
  REQUEST_REVIEW_LABEL: 'Rent you are asking for ($/week)',
  REQUEST_REVIEW_PLACEHOLDER: 'Your proposed weekly rent',
  NON_NEGOTIABLE: 'Rent is marked non-negotiable — you can accept or decline only.',
  DISPUTE: 'Dispute the increase',
  DISPUTE_BODY:
    'Think the rent increase is excessive?\n\nYou may be able to apply to NCAT to have the rent increase reviewed. Time limits may apply.',
  VACATE_PROMPT: 'Planning to leave the property?',
  VACATE_ACTION: 'Submit notice to vacate',
  VACATE_DATE_LABEL: 'Move-out date',
  VACATE_CONFIRM: 'Submit notice',
  VACATE_HINT:
    'Submitting this ends the tenancy on the date you choose. Your property manager opens the vacating steps — final inspection, keys and bond — from there.',
} as const;
