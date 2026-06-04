'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { FileUploadField } from '@/components/tenant/file-upload-field';
import { Button } from '@/components/ui/button';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';
import { APPLICATION_STATUS_LABEL } from '@/lib/tenant-labels';
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
        <p className="font-medium">{APPLICATION_STATUS_LABEL[app.status]}</p>
        {app.status === 'approved' && (
          <Button asChild className="w-full">
            <Link href={ROUTES.ONBOARDING}>Start onboarding checklist</Link>
          </Button>
        )}
        {app.status === 'missing_information' && app.missingDocuments && (
          <div className="space-y-3 rounded-xl border border-amber-500/40 p-4">
            <p className="font-medium">Upload missing documents</p>
            <ul className="text-muted-foreground list-disc pl-4 text-xs">
              {app.missingDocuments.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <FileUploadField
              accept="image/*,.pdf"
              onFileSelect={() => toast.success('Document uploaded — pending review')}
            />
          </div>
        )}
        {app.status === 'declined' && app.declineReason && (
          <p className="text-muted-foreground">{app.declineReason}</p>
        )}
        {app.status === 'declined' && (
          <Button asChild variant="outline" className="w-full">
            <Link href={ROUTES.PROPERTIES}>Browse other properties</Link>
          </Button>
        )}
      </div>
    </TenantShell>
  );
}
