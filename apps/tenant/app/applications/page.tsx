'use client';

import Link from 'next/link';

import { TenantShell } from '@/components/layout/tenant-shell';
import { StatusBadge } from '@/components/tenant/status-badge';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { applicationDetail } from '@/constants/routes';
import { APPLICATION_STATUS_LABEL } from '@/lib/tenant-labels';
import { formatDateTime } from '@/lib/utils';

export default function ApplicationsPage() {
  const { applications, apiConnected } = useTenantData();

  return (
    <TenantShell title="Applications">
      <p className="text-muted-foreground mb-4 text-sm">
        Track your application on properties where your agent has opened a new-leasing case.
      </p>
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
                label={APPLICATION_STATUS_LABEL[app.status].split('—')[0].trim()}
                variant={
                  app.status === 'approved'
                    ? 'success'
                    : app.status === 'declined'
                      ? 'default'
                      : 'action'
                }
              />
            </div>
            {app.status === 'missing_information' && app.missingDocuments && (
              <p className="text-amber-400 mt-2 text-xs">
                {app.missingDocuments.length} document(s) required
              </p>
            )}
          </Link>
        ))}
        {applications.length === 0 && (
          <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
            {apiConnected
              ? 'Your property manager will open a new-leasing case here when you are applying for a property. You will receive a notification when action is required.'
              : 'No applications yet. In live mode, applications appear when your agent opens a new-leasing case for you.'}
          </p>
        )}
      </div>
    </TenantShell>
  );
}
