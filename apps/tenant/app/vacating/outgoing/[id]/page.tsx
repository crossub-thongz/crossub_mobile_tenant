'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

import { TenantShell } from '@/components/layout/tenant-shell';
import { FileUploadField } from '@/components/tenant/file-upload-field';
import { ReportSectionCard } from '@/components/tenant/report-section-card';
import { StatusBadge } from '@/components/tenant/status-badge';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';
import { resolveBackHref } from '@/lib/back-navigation';
import { fetchTenantOutgoingInspection } from '@/lib/crossub-api/tenant-account-client';
import { toOutgoingReport } from '@/lib/crossub-api/tenant-mappers';
import { OUTGOING_STATUS_LABEL } from '@/lib/tenant-labels';
import type { OutgoingReport } from '@/lib/types';
import { toast } from 'sonner';

export default function OutgoingReportPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const backHref = resolveBackHref(searchParams.get('from'), ROUTES.VACATING);
  const { outgoingReport, outgoingInspections, confirmOutgoingSection, apiConnected } =
    useTenantData();
  const [loadedReport, setLoadedReport] = useState<OutgoingReport | null>(null);
  const [loading, setLoading] = useState(false);

  const summary = outgoingInspections.find((r) => r.id === id);
  const report =
    loadedReport ??
    (outgoingReport?.id === id ? outgoingReport : null) ??
    summary ??
    null;

  useEffect(() => {
    if (!apiConnected || report?.sections.length) return;
    setLoading(true);
    void fetchTenantOutgoingInspection(id)
      .then((detail) => setLoadedReport(toOutgoingReport(detail)))
      .catch(() => setLoadedReport(null))
      .finally(() => setLoading(false));
  }, [apiConnected, id, report?.sections.length]);

  if (loading && !report) {
    return (
      <TenantShell title="Outgoing report" backHref={backHref}>
        <p className="text-sm text-muted-foreground">Loading report…</p>
      </TenantShell>
    );
  }

  if (!report || report.id !== id) {
    return (
      <TenantShell title="Outgoing report" backHref={backHref}>
        <p className="text-sm text-muted-foreground">Report not found.</p>
      </TenantShell>
    );
  }

  const needsPhotos = report.status === 'supporting_photos_required';

  return (
    <TenantShell title="Outgoing report" backHref={backHref}>
      <p className="text-muted-foreground mb-4 text-sm">{report.propertyAddress}</p>
      <StatusBadge
        label={OUTGOING_STATUS_LABEL[report.status]}
        variant={report.status === 'confirmed' ? 'success' : 'action'}
        className="mb-4"
      />
      <p className="text-muted-foreground mb-4 text-xs">
        Review and confirm section-by-section. Upload supporting photos when re-clean, repair, or
        evidence is required.
      </p>
      <div className="space-y-4">
        {report.sections.map((section) => (
          <ReportSectionCard
            key={section.id}
            section={section}
            onConfirm={() => void confirmOutgoingSection(section.id)}
            onDispute={(comment) => void confirmOutgoingSection(section.id, comment)}
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
