import type { LeaseSummary, RentReviewCase } from '@/lib/types';

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
