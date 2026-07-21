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

/**
 * Next rent review date for the property page — prefers the lease snapshot, then
 * the accepted review's scheduled follow-up.
 */
export function resolveNextRentReviewDate(
  lease: LeaseSummary | null,
  reviews: RentReviewCase[],
): string | null {
  if (lease?.nextRentReviewAt) return lease.nextRentReviewAt;
  const accepted = findAcceptedRentReview(reviews);
  return accepted?.nextRentReviewOpensOn ?? null;
}

/** Show the next review date after the tenant has accepted a rent review. */
export function shouldShowNextRentReviewDate(
  lease: LeaseSummary | null,
  reviews: RentReviewCase[],
): boolean {
  return Boolean(findAcceptedRentReview(reviews) && resolveNextRentReviewDate(lease, reviews));
}
