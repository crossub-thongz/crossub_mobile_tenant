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
