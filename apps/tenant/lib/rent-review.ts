import type { RentReviewCase } from '@/lib/types';

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
