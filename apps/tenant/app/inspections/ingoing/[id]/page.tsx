'use client';

import { useParams, useSearchParams } from 'next/navigation';

import { TenantShell } from '@/components/layout/tenant-shell';
import { ReportSectionCard } from '@/components/tenant/report-section-card';
import { StatusBadge } from '@/components/tenant/status-badge';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';
import { resolveBackHref } from '@/lib/back-navigation';
import { INGOING_STATUS_LABEL } from '@/lib/tenant-labels';
import { formatDate } from '@/lib/utils';

export default function IngoingReportPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const backHref = resolveBackHref(searchParams.get('from'), ROUTES.INSPECTIONS);
  const { ingoingReport, confirmIngoingSection } = useTenantData();

  if (!ingoingReport || ingoingReport.id !== id) {
    return (
      <TenantShell title="Ingoing report" backHref={backHref}>
        <p className="text-sm text-muted-foreground">Report not found.</p>
      </TenantShell>
    );
  }

  const total = ingoingReport.sections.length;

  return (
    <TenantShell title="Ingoing report" backHref={backHref}>
      <p className="text-muted-foreground mb-2 text-sm">{ingoingReport.propertyAddress}</p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge
          label={INGOING_STATUS_LABEL[ingoingReport.status]}
          variant={ingoingReport.status === 'confirmed' ? 'success' : 'action'}
        />
        <span className="text-muted-foreground text-xs">
          Due {formatDate(ingoingReport.dueBy)} · {ingoingReport.confirmedCount}/{total} confirmed
        </span>
      </div>
      <p className="text-muted-foreground mb-4 text-xs">
        Confirm each section individually. Disputes and confirmations are timestamped for audit.
      </p>
      <div className="space-y-4">
        {ingoingReport.sections.map((section) => (
          <ReportSectionCard
            key={section.id}
            section={section}
            onConfirm={() => confirmIngoingSection(section.id)}
            onDispute={(comment) => confirmIngoingSection(section.id, comment)}
          />
        ))}
      </div>
    </TenantShell>
  );
}
