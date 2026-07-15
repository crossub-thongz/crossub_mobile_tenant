'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { FileUploadField } from '@/components/tenant/file-upload-field';
import { NswTenancyApplicationReadonly } from '@/components/tenant/nsw-tenancy-application-readonly';
import { Button } from '@/components/ui/button';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';
import {
  fetchTenantApplicationDetail,
  type TenantApplicationDetail,
} from '@/lib/crossub-api/tenant-account-client';
import { APPLICATION_STATUS_LABEL } from '@/lib/tenant-labels';
import { formatDateTime } from '@/lib/utils';

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { applications } = useTenantData();
  const app = applications.find((a) => a.id === id);
  const [detail, setDetail] = useState<TenantApplicationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingDetail(true);
    void fetchTenantApplicationDetail(id)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!app && !detail && !loadingDetail) {
    return (
      <TenantShell title="Application" backHref={ROUTES.APPLICATIONS}>
        <p className="text-sm text-muted-foreground">Not found.</p>
      </TenantShell>
    );
  }

  const reference = detail?.reference ?? app?.referenceNumber ?? id;
  const propertyAddress = detail?.propertyAddress ?? app?.propertyAddress ?? '';
  const displayStatus = app?.status ?? 'submitted';
  const submittedAt = detail?.submittedAt ?? app?.submittedAt ?? '';

  return (
    <TenantShell title={reference} backHref={ROUTES.APPLICATIONS}>
      <div className="space-y-4 text-sm">
        <p>{propertyAddress}</p>
        {submittedAt && (
          <p className="text-muted-foreground">Submitted {formatDateTime(submittedAt)}</p>
        )}
        <p className="font-medium">{APPLICATION_STATUS_LABEL[displayStatus]}</p>

        {loadingDetail ? (
          <p className="text-muted-foreground text-xs">Loading application form…</p>
        ) : detail?.formData ? (
          <div className="space-y-2">
            <h2 className="font-semibold">Submitted application form</h2>
            <NswTenancyApplicationReadonly
              propertyAddress={propertyAddress}
              formData={detail.formData}
              documents={detail.documents}
            />
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">
            No stored form data for this application.
          </p>
        )}

        {app?.status === 'approved' && (
          <Button asChild className="w-full">
            <Link href={ROUTES.ONBOARDING}>Start onboarding checklist</Link>
          </Button>
        )}
        {app?.status === 'missing_information' && app.missingDocuments && (
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
        {app?.status === 'declined' && app.declineReason && (
          <p className="text-muted-foreground">{app.declineReason}</p>
        )}
        {app?.status === 'declined' && (
          <Button asChild variant="outline" className="w-full">
            <Link href={ROUTES.PROPERTIES}>Browse other properties</Link>
          </Button>
        )}
      </div>
    </TenantShell>
  );
}
