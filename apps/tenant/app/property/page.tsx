'use client';

import Link from 'next/link';

import { TenantShell } from '@/components/layout/tenant-shell';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function PropertyPage() {
  const { lease } = useTenantData();

  if (!lease) {
    return (
      <TenantShell title="Property">
        <p className="text-muted-foreground text-sm">
          No property linked yet.{' '}
          <Link href={ROUTES.PROPERTIES} className="text-primary">
            Browse listings
          </Link>{' '}
          to apply.
        </p>
      </TenantShell>
    );
  }

  return (
    <TenantShell title="Property details">
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-lg font-semibold">{lease.propertyAddress}</p>
          <p className="text-primary mt-2 text-xl font-semibold">
            {formatCurrency(lease.rentWeekly)}/week
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            Lease {formatDate(lease.leaseStart)} – {formatDate(lease.leaseEnd)}
          </p>
          <p className="mt-2 text-sm capitalize">
            Status: {lease.status}
            {lease.periodic && ' · Periodic tenancy'}
          </p>
          {lease.renewalDueInDays != null && lease.renewalDueInDays <= 90 && (
            <Link
              href={ROUTES.RENEWAL}
              className="text-primary mt-3 inline-block text-xs font-medium"
            >
              Renewal decision due →
            </Link>
          )}
        </div>
        <Link
          href={ROUTES.LEASE}
          className="text-primary block text-center text-sm font-medium"
        >
          View lease documents →
        </Link>
      </div>
    </TenantShell>
  );
}
