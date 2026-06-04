'use client';

import { useParams } from 'next/navigation';

import { TenantShell } from '@/components/layout/tenant-shell';
import { FileUploadField } from '@/components/tenant/file-upload-field';
import { ReportSectionCard } from '@/components/tenant/report-section-card';
import { StatusBadge } from '@/components/tenant/status-badge';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';
import { OUTGOING_STATUS_LABEL } from '@/lib/tenant-labels';
import { toast } from 'sonner';

export default function OutgoingReportPage() {
  const { id } = useParams<{ id: string }>();
  const { outgoingReport, confirmOutgoingSection } = useTenantData();

  if (!outgoingReport || outgoingReport.id !== id) {
    return (
      <TenantShell title="Outgoing report" backHref={ROUTES.VACATING}>
        <p className="text-sm text-muted-foreground">Report not found.</p>
      </TenantShell>
    );
  }

  const needsPhotos = outgoingReport.status === 'supporting_photos_required';

  return (
    <TenantShell title="Outgoing report" backHref={ROUTES.VACATING}>
      <p className="text-muted-foreground mb-4 text-sm">{outgoingReport.propertyAddress}</p>
      <StatusBadge
        label={OUTGOING_STATUS_LABEL[outgoingReport.status]}
        variant={outgoingReport.status === 'confirmed' ? 'success' : 'action'}
        className="mb-4"
      />
      <p className="text-muted-foreground mb-4 text-xs">
        Review and confirm section-by-section. Upload supporting photos when re-clean, repair, or
        evidence is required.
      </p>
      <div className="space-y-4">
        {outgoingReport.sections.map((section) => (
          <ReportSectionCard
            key={section.id}
            section={section}
            onConfirm={() => confirmOutgoingSection(section.id)}
            onDispute={(comment) => confirmOutgoingSection(section.id, comment)}
          />
        ))}
      </div>
      {needsPhotos && (
        <div className="mt-6 space-y-3 rounded-xl border border-amber-500/40 p-4">
          <p className="text-sm font-medium">Supporting photos required</p>
          <FileUploadField accept="image/*" onFileSelect={() => toast.success('Evidence uploaded')} />
        </div>
      )}
    </TenantShell>
  );
}
