'use client';

import Link from 'next/link';

import { TenantShell } from '@/components/layout/tenant-shell';
import { StatusBadge } from '@/components/tenant/status-badge';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { applicationDetail } from '@/constants/routes';
import { APPLICATION_STATUS_LABEL } from '@/lib/tenant-labels';
import { formatDateTime } from '@/lib/utils';

export default function ApplicationsPage() {
  const { applications } = useTenantData();

  return (
    <TenantShell title="Applications">
      <p className="text-muted-foreground mb-4 text-sm">
        Track status from submission through approval. Reference number and timestamp recorded for
        audit.
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
      </div>
    </TenantShell>
  );
}
