'use client';

import Link from 'next/link';
import { AlertTriangle, TrendingUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { rentReviewDetail } from '@/constants/routes';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { findPendingRentReview } from '@/lib/rent-review';
import { formatCurrency } from '@/lib/utils';

/** Prominent top-of-screen alert when a formal rent review notice needs a response. */
export function RentReviewNoticeAlert() {
  const { rentReviews, notifications, markNotificationRead } = useTenantData();
  const pending = findPendingRentReview(rentReviews);
  const unreadNotice = notifications.find((n) => !n.read && n.type === 'rent_review');

  if (!pending && !unreadNotice) return null;

  const href = pending
    ? rentReviewDetail(pending.id)
    : (unreadNotice?.href ?? '/rent-review');

  const title = pending ? 'Rent review notice — action required' : unreadNotice!.title;
  const body = pending
    ? `Your property manager proposed ${formatCurrency(pending.proposedRentWeekly)}/week. ${
        pending.rentNegotiable === true
          ? 'Accept, decline, or submit a counter-offer.'
          : 'Accept or decline — rent is non-negotiable.'
      }`
    : unreadNotice!.body;

  const handleOpen = () => {
    if (unreadNotice) markNotificationRead(unreadNotice.id);
  };

  return (
    <div className="mb-4 rounded-2xl border border-primary/35 bg-primary/10 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-primary mt-0.5 size-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-primary size-4 shrink-0" />
            <p className="text-sm font-semibold">{title}</p>
          </div>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{body}</p>
          {unreadNotice?.actionRequired ? (
            <p className="text-primary mt-1 text-xs font-medium">{unreadNotice.actionRequired}</p>
          ) : null}
          <Button asChild size="sm" className="mt-3 h-8 w-full text-xs">
            <Link href={href} onClick={handleOpen}>
              Review rent increase notice
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
