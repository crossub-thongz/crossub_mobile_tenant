'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';
import { formatDateTime } from '@/lib/utils';

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { applications } = useTenantData();
  const app = applications.find((a) => a.id === id);

  if (!app) {
    return (
      <TenantShell title="Application" backHref={ROUTES.APPLICATIONS}>
        <p className="text-sm text-muted-foreground">Not found.</p>
      </TenantShell>
    );
  }

  return (
    <TenantShell title={app.referenceNumber} backHref={ROUTES.APPLICATIONS}>
      <div className="space-y-4 text-sm">
        <p>{app.propertyAddress}</p>
        <p className="text-muted-foreground">Submitted {formatDateTime(app.submittedAt)}</p>
        <p className="font-medium capitalize">{app.status.replace(/_/g, ' ')}</p>
        {app.status === 'approved' && (
          <Button asChild className="w-full">
            <Link href={ROUTES.ONBOARDING}>Start onboarding checklist</Link>
          </Button>
        )}
        {app.status === 'missing_information' && app.missingDocuments && (
          <ul className="list-disc pl-4 text-muted-foreground">
            {app.missingDocuments.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        )}
        {app.status === 'declined' && app.declineReason && (
          <p className="text-muted-foreground">{app.declineReason}</p>
        )}
      </div>
    </TenantShell>
  );
}
