'use client';

import Link from 'next/link';

import { TenantShell } from '@/components/layout/tenant-shell';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { rentReviewDetail } from '@/constants/routes';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function RentReviewPage() {
  const { rentReviews } = useTenantData();

  return (
    <TenantShell title="Rent review">
      <div className="space-y-3">
        {rentReviews.map((r) => (
          <Link
            key={r.id}
            href={rentReviewDetail(r.id)}
            className="block rounded-xl border bg-card p-4"
          >
            <p className="font-semibold">{r.propertyAddress}</p>
            <p className="text-sm">
              {formatCurrency(r.currentRentWeekly)} →{' '}
              <span className="text-primary">{formatCurrency(r.proposedRentWeekly)}</span>
              /week
            </p>
            <p className="text-muted-foreground text-xs">
              Effective {formatDate(r.effectiveDate)} · {r.status}
            </p>
          </Link>
        ))}
        {rentReviews.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No rent review notices yet. You will see one here after your property manager
            sends a rent review notice.
          </p>
        )}
      </div>
    </TenantShell>
  );
}
