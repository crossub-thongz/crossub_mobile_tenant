import {
  RENT_REVIEW_ADVANCE_ORDER_DAYS,
  RENT_REVIEW_CYCLE_YEARS,
} from '@/constants/rent-review';
import type { LeaseSummary, RentReviewCase, VacatingCase } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

/** Whether the tenant accepted the proposed rent increase. */
export function isAcceptedRentReview(review: RentReviewCase): boolean {
  return review.status === 'accepted';
}

/** Whether the tenant still needs to accept, decline, or counter the notice. */
export function isPendingRentReview(review: RentReviewCase): boolean {
  return review.status === 'pending';
}

/** The first rent review awaiting tenant action, if any. */
export function findPendingRentReview(
  reviews: RentReviewCase[],
): RentReviewCase | undefined {
  return reviews.find(isPendingRentReview);
}

/** Most recent accepted rent review, if any. */
export function findAcceptedRentReview(
  reviews: RentReviewCase[],
): RentReviewCase | undefined {
  return reviews.find(isAcceptedRentReview);
}

export interface PendingRentChange {
  newRent: number;
  startDate: string;
}

function isFutureCalendarDate(iso: string): boolean {
  const day = iso.slice(0, 10);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(`${day}T12:00:00`);
  return start.getTime() > today.getTime();
}

function resolveAcceptedNewRent(review: RentReviewCase): number {
  return review.noticeTerms?.newRentWeekly ?? review.proposedRentWeekly;
}

/** Tenant has vacated — hide upcoming rent once the vacate date has passed. */
export function isTenantVacated(
  lease: LeaseSummary | null,
  vacatingCase: VacatingCase | null | undefined,
): boolean {
  if (!lease) return true;
  const vacateIso =
    vacatingCase?.status === 'open' ? vacatingCase.vacatingDate : undefined;
  if (!vacateIso) return false;
  const day = vacateIso.slice(0, 10);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const vacate = new Date(`${day}T12:00:00`);
  return vacate.getTime() <= today.getTime();
}

/** Accepted rent review where the new weekly rent has not started yet. */
export function resolveUpcomingAcceptedRentChange(
  reviews: RentReviewCase[],
  currentDisplayRent?: number | null,
): PendingRentChange | null {
  const candidates = reviews
    .filter(isAcceptedRentReview)
    .flatMap((review) => {
      const startDate =
        review.effectiveDate || review.noticeTerms?.rentIncreaseOn || '';
      if (!startDate || !isFutureCalendarDate(startDate)) return [];

      const newRent = resolveAcceptedNewRent(review);
      if (!newRent || newRent <= 0) return [];

      if (
        currentDisplayRent != null &&
        currentDisplayRent > 0 &&
        Math.abs(newRent - currentDisplayRent) < 0.01
      ) {
        return [];
      }

      return [{ newRent, startDate }];
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return candidates[0] ?? null;
}

export function formatUpcomingRentChangeHint(change: PendingRentChange): string {
  return `${formatCurrency(change.newRent)}/wk from ${formatDate(change.startDate)}`;
}

export function resolveUpcomingRentHint(
  reviews: RentReviewCase[],
  lease: LeaseSummary | null,
  vacatingCase: VacatingCase | null | undefined,
): string | undefined {
  if (isTenantVacated(lease, vacatingCase)) return undefined;
  const change = resolveUpcomingAcceptedRentChange(reviews, lease?.rentWeekly);
  return change ? formatUpcomingRentChangeHint(change) : undefined;
}

/** Calendar date at local noon — stable day arithmetic that ignores the clock. */
function calendarDate(iso: string | null | undefined): Date | null {
  const day = iso?.trim().slice(0, 10) ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const parsed = new Date(`${day}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toIsoDay(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function addYears(date: Date, years: number): Date {
  const next = new Date(date.getTime());
  const dayOfMonth = next.getDate();
  next.setFullYear(next.getFullYear() + years);
  // 29 February has no counterpart in a non-leap year — setFullYear rolls it forward to
  // 1 March. Step back to the last day of the target month so the anniversary lands right.
  if (next.getDate() !== dayOfMonth) next.setDate(0);
  return next;
}

function subtractDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() - days);
  return next;
}

/**
 * The day the rent was last set — CRS-0082.
 *
 * The most recent accepted rent increase, or the lease start when the tenant has not been
 * through a review yet (their first tenancy period). This is the anchor NSW counts the
 * twelve-month rent-increase period from, so it is what the next review date hangs off.
 */
export function resolveLastRentSetDate(
  lease: LeaseSummary | null,
  reviews: RentReviewCase[],
): string | null {
  const increases = reviews
    .filter(isAcceptedRentReview)
    .map((review) =>
      calendarDate(review.effectiveDate || review.noticeTerms?.rentIncreaseOn),
    )
    .filter((date): date is Date => date != null)
    .map(toIsoDay)
    .sort();

  const lastIncrease = increases[increases.length - 1];
  if (lastIncrease) return lastIncrease;

  const leaseStart = calendarDate(lease?.leaseStart);
  return leaseStart ? toIsoDay(leaseStart) : null;
}

/**
 * When the next review order opens: twelve months after the rent was last set, less the
 * eighty days of run-up the agent needs to serve a sixty-day notice.
 */
export function deriveNextRentReviewDate(lastRentSetOn: string | null): string | null {
  const anchor = calendarDate(lastRentSetOn);
  if (!anchor) return null;
  return toIsoDay(
    subtractDays(addYears(anchor, RENT_REVIEW_CYCLE_YEARS), RENT_REVIEW_ADVANCE_ORDER_DAYS),
  );
}

/**
 * Next rent review date for the property page — CRS-0082.
 *
 * Derived from the day the rent was last set rather than read off the lease snapshot.
 * `lease.nextRentReviewAt` is the agent registry's `Property.nextRentReviewAt`, which is
 * only rewritten when the property or a review is saved; on a property whose column still
 * held the date implied by a long lease end it put the review two years out — the reported
 * "next rent review in 655 days" against a June 2026 increase. The anchor the tenant can
 * actually see (their last accepted increase, else their lease start) always dates the
 * cycle correctly, so the stored column is only a fallback for a lease with neither.
 */
export function resolveNextRentReviewDate(
  lease: LeaseSummary | null,
  reviews: RentReviewCase[],
): string | null {
  const derived = deriveNextRentReviewDate(resolveLastRentSetDate(lease, reviews));
  if (derived) return derived;

  const accepted = findAcceptedRentReview(reviews);
  return accepted?.nextRentReviewOpensOn ?? lease?.nextRentReviewAt ?? null;
}

/** Show the next rent review countdown when a target date is on file. */
export function shouldShowNextRentReviewDate(
  lease: LeaseSummary | null,
  reviews: RentReviewCase[],
): boolean {
  return Boolean(resolveNextRentReviewDate(lease, reviews));
}
