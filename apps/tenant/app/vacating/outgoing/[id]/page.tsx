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
  const { outgoingReport, outgoingInspections, confirmOutgoingSection } = useTenantData();
  const [loadedReport, setLoadedReport] = useState<OutgoingReport | null>(null);
  /** Which id we have actually tried to load, and how that attempt ended. */
  const [lookup, setLookup] = useState<{
    id: string;
    state: 'loading' | 'done' | 'failed';
  } | null>(null);

  const summary = outgoingInspections.find((r) => r.id === id);
  const report =
    loadedReport ??
    (outgoingReport?.id === id ? outgoingReport : null) ??
    summary ??
    null;

  /**
   * Fetch the report by id, once per id.
   *
   * This used to be gated on `apiConnected`, which is only set at the end of the provider's full
   * refresh. Arriving here from the End of lease screen renders before that completes, so the
   * fetch was skipped, `report` was null, `loading` was still false — and the page fell straight
   * through to "Report not found." The tenant was told the report did not exist on a case whose
   * detail endpoint answers 200 with a reportUrl, purely because nothing had looked yet.
   *
   * The page knows the id; it does not need the provider's permission to ask for it.
   */
  useEffect(() => {
    if (lookup?.id === id) return;
    let cancelled = false;
    setLookup({ id, state: 'loading' });
    void fetchTenantOutgoingInspection(id)
      .then((detail) => {
        if (cancelled) return;
        setLoadedReport(toOutgoingReport(detail));
        setLookup({ id, state: 'done' });
      })
      .catch(() => {
        if (cancelled) return;
        setLoadedReport(null);
        setLookup({ id, state: 'failed' });
      });
    return () => {
      cancelled = true;
    };
  }, [id, lookup?.id]);

  const retry = () => setLookup(null);

  // Anything cached (summary or the provider's current report) renders straight away, even while
  // the fuller fetch is still in flight.
  if (!report && lookup?.state !== 'failed') {
    return (
      <TenantShell title="Outgoing report" backHref={backHref}>
        <p className="text-sm text-muted-foreground">Loading report…</p>
      </TenantShell>
    );
  }

  if (!report || report.id !== id) {
    // The API client throws a bare Error, so a missing report and a failed request are
    // indistinguishable here. Say what is actually known rather than asserting it does not exist.
    return (
      <TenantShell title="Outgoing report" backHref={backHref}>
        <p className="text-sm text-muted-foreground">
          We couldn&rsquo;t load this report just now.
        </p>
        <button
          type="button"
          onClick={retry}
          className="text-primary mt-3 text-sm font-medium underline"
        >
          Try again
        </button>
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
            currentPhotoLabel="Outgoing"
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
