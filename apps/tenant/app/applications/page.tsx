'use client';

import Link from 'next/link';

import { TenantShell } from '@/components/layout/tenant-shell';
import { StatusBadge } from '@/components/tenant/status-badge';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { applicationDetail } from '@/constants/routes';
import { formatDateTime } from '@/lib/utils';

const STATUS_LABEL: Record<string, string> = {
  submitted: 'Submitted',
  missing_information: 'Missing information',
  under_review: 'Under review',
  approved: 'Approved',
  declined: 'Declined',
};

export default function ApplicationsPage() {
  const { applications } = useTenantData();

  return (
    <TenantShell title="Applications">
      <div className="space-y-3">
        {applications.map((app) => (
          <Link
            key={app.id}
            href={applicationDetail(app.id)}
            className="block rounded-xl border bg-card p-4"
          >
            <p className="font-semibold">{app.propertyAddress}</p>
            <p className="text-muted-foreground text-xs">Ref {app.referenceNumber}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Submitted {formatDateTime(app.submittedAt)}
            </p>
            <div className="mt-2">
              <StatusBadge
                label={STATUS_LABEL[app.status] ?? app.status}
                variant={app.status === 'approved' ? 'success' : 'action'}
              />
            </div>
          </Link>
        ))}
      </div>
    </TenantShell>
  );
}
