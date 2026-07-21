'use client';

import { FileText } from 'lucide-react';

import { TenantShell } from '@/components/layout/tenant-shell';
import { DocumentActions } from '@/components/tenant/document-actions';
import { StatusBadge } from '@/components/tenant/status-badge';
import { UpcomingRentHint } from '@/components/tenant/upcoming-rent-hint';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { resolveUpcomingRentHint } from '@/lib/rent-review';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function LeasePage() {
  const { lease, storedDocuments, rentReviews, vacatingCase } = useTenantData();
  const leaseDocuments = storedDocuments.filter((d) => d.category === 'Lease');
  const upcomingRentHint = resolveUpcomingRentHint(rentReviews, lease, vacatingCase);

  if (!lease) {
    return (
      <TenantShell title="My lease">
        <p className="text-muted-foreground text-sm">No active lease linked to your account.</p>
      </TenantShell>
    );
  }

  return (
    <TenantShell title="My lease">
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="font-semibold">{lease.propertyAddress}</p>
          <p className="text-primary mt-2 text-lg font-semibold">
            {formatCurrency(lease.rentWeekly)}/week
          </p>
          <UpcomingRentHint hint={upcomingRentHint} />
          <p className="text-muted-foreground mt-2 text-sm">
            {formatDate(lease.leaseStart)} – {formatDate(lease.leaseEnd)}
            {lease.periodic && ' · Periodic tenancy'}
          </p>
          <StatusBadge label={lease.status} variant="success" className="mt-3" />
          {lease.renewalDueInDays != null && lease.renewalDueInDays <= 90 && (
            <p className="text-amber-400 mt-3 text-xs">
              Renewal decision due in {lease.renewalDueInDays} days
            </p>
          )}
        </div>
        <section>
          <h2 className="text-sm font-semibold">Documents</h2>
          <ul className="mt-2 space-y-3">
            {leaseDocuments.map((d) => (
              <li key={d.id} className="rounded-lg border bg-card p-3">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{d.name}</p>
                    <span className="text-muted-foreground text-xs">
                      Uploaded {formatDate(d.uploadedAt)}
                    </span>
                    {d.url ? (
                      <DocumentActions
                        documentId={d.id}
                        fileName={d.name}
                        documentUrl={d.url}
                        className="mt-3"
                        compact
                      />
                    ) : (
                      <p className="text-muted-foreground mt-2 text-xs">
                        Preview not available for this file yet.
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
            {leaseDocuments.length === 0 && (
              <p className="text-muted-foreground text-sm">No lease documents uploaded yet.</p>
            )}
          </ul>
        </section>
      </div>
    </TenantShell>
  );
}
