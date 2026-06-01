'use client';

import { useTenantData } from '@/components/providers/tenant-data-provider';
import { formatCurrency, formatDate } from '@/lib/utils';

const PHASE_LABEL: Record<string, string> = {
  searching: 'Browsing properties',
  applied: 'Application in progress',
  onboarding: 'Onboarding in progress',
  active: 'Active tenancy',
  renewal: 'Renewal decision due',
  vacating: 'Vacating in progress',
  completed: 'Tenancy completed',
};

export function LifecycleBanner() {
  const { phase, lease, arrears } = useTenantData();

  return (
    <div className="rounded-xl border bg-card p-4 space-y-2">
      <p className="text-muted-foreground text-xs font-medium uppercase">Your status</p>
      <p className="text-base font-semibold">{PHASE_LABEL[phase] ?? phase}</p>
      {lease && (
        <div className="text-muted-foreground space-y-0.5 text-sm">
          <p>{lease.propertyAddress}</p>
          <p>
            {formatCurrency(lease.rentWeekly)}/week · ends {formatDate(lease.leaseEnd)}
          </p>
        </div>
      )}
      {arrears && (
        <p className="text-destructive text-xs font-medium">
          Outstanding {formatCurrency(arrears.outstandingAmount)} — payment reminder active
        </p>
      )}
    </div>
  );
}
