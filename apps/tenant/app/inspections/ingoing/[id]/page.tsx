'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

import { TenantShell } from '@/components/layout/tenant-shell';
import { ReportSectionCard } from '@/components/tenant/report-section-card';
import { StatusBadge } from '@/components/tenant/status-badge';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';
import { fetchTenantIngoingInspection } from '@/lib/crossub-api/tenant-account-client';
import { toIngoingReport } from '@/lib/crossub-api/tenant-mappers';
import { resolveBackHref } from '@/lib/back-navigation';
import { INGOING_STATUS_LABEL } from '@/lib/tenant-labels';
import { formatDate } from '@/lib/utils';

export default function IngoingReportPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const backHref = resolveBackHref(searchParams.get('from'), ROUTES.INSPECTIONS);
  const { ingoingReport, confirmIngoingSection, apiConnected } = useTenantData();
  const [loadedReport, setLoadedReport] = useState(ingoingReport);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ingoingReport?.id === id) {
      setLoadedReport(ingoingReport);
      return;
    }
    if (!apiConnected) return;
    setLoading(true);
    void fetchTenantIngoingInspection(id)
      .then((detail) => setLoadedReport(toIngoingReport(detail)))
      .catch(() => setLoadedReport(null))
      .finally(() => setLoading(false));
  }, [apiConnected, id, ingoingReport]);

  const report = loadedReport?.id === id ? loadedReport : null;

  if (loading) {
    return (
      <TenantShell title="Ingoing report" backHref={backHref}>
        <p className="text-muted-foreground text-sm">Loading report…</p>
      </TenantShell>
    );
  }

  if (!report) {
    return (
      <TenantShell title="Ingoing report" backHref={backHref}>
        <p className="text-muted-foreground text-sm">
          {apiConnected
            ? 'This ingoing inspection is not available. Your property manager will schedule one during your move-in process.'
            : 'Report not found.'}
        </p>
      </TenantShell>
    );
  }

  const total = report.sections.length;

  return (
    <TenantShell title="Ingoing report" backHref={backHref}>
      <p className="text-muted-foreground mb-2 text-sm">{report.propertyAddress}</p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge
          label={INGOING_STATUS_LABEL[report.status]}
          variant={report.status === 'confirmed' ? 'success' : 'action'}
        />
        <span className="text-muted-foreground text-xs">
          Due {formatDate(report.dueBy)} · {report.confirmedCount}/{total} confirmed
        </span>
      </div>
      <p className="text-muted-foreground mb-4 text-xs">
        Confirm each section individually. Disputes and confirmations are timestamped for audit.
      </p>
      <div className="space-y-4">
        {report.sections.map((section) => (
          <ReportSectionCard
            key={section.id}
            section={section}
            onConfirm={() => void confirmIngoingSection(section.id)}
            onDispute={(comment) => void confirmIngoingSection(section.id, comment)}
          />
        ))}
      </div>
    </TenantShell>
  );
}
