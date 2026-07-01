'use client';

import Link from 'next/link';
import { Building2, Calendar, FileText, MapPin } from 'lucide-react';

import { TenantShell } from '@/components/layout/tenant-shell';
import { PropertyHubActions } from '@/components/tenant/property-hub-actions';
import { EmptyState } from '@/components/tenant/empty-state';
import { InfoCard } from '@/components/tenant/info-card';
import { StatusBadge } from '@/components/tenant/status-badge';
import { Button } from '@/components/ui/button';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function PropertyPage() {
  const { lease } = useTenantData();

  if (!lease) {
    return (
      <TenantShell title="Property">
        <EmptyState
          icon={Building2}
          title="No property linked"
          description="Browse available listings and submit an application to start your tenancy."
          action={
            <Button asChild>
              <Link href={ROUTES.PROPERTIES}>Browse listings</Link>
            </Button>
          }
        />
      </TenantShell>
    );
  }

  return (
    <TenantShell title="Property details">
      <div className="space-y-4">
        <InfoCard icon={MapPin} accent="primary">
          <p className="text-lg font-semibold leading-snug">{lease.propertyAddress}</p>
          <p className="text-primary mt-3 text-2xl font-bold tracking-tight">
            {formatCurrency(lease.rentWeekly)}
            <span className="text-muted-foreground text-base font-normal">/week</span>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge label={lease.status} variant="success" />
            {lease.periodic && <StatusBadge label="Periodic" />}
          </div>
        </InfoCard>

        <div className="grid grid-cols-2 gap-3">
          <InfoCard icon={Calendar} label="Lease start">
            <p className="font-medium">{formatDate(lease.leaseStart)}</p>
          </InfoCard>
          <InfoCard icon={Calendar} label="Lease end">
            <p className="font-medium">{formatDate(lease.leaseEnd)}</p>
          </InfoCard>
        </div>

        {lease.renewalDueInDays != null && lease.renewalDueInDays <= 90 && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm font-medium text-amber-400">Renewal decision due</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {lease.renewalDueInDays} days remaining on your current lease term.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href={ROUTES.RENEWAL}>Review renewal options</Link>
            </Button>
          </div>
        )}

        <PropertyHubActions />

        <Button asChild variant="secondary" className="w-full">
          <Link href={ROUTES.LEASE}>
            <FileText className="size-4" />
            View lease documents
          </Link>
        </Button>
      </div>
    </TenantShell>
  );
}
