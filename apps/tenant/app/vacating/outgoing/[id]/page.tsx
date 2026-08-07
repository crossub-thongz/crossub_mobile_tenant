'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ExternalLink, FileText } from 'lucide-react';

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
  /** How the lookup for the current id ended. Starts as loading — nothing is known yet. */
  const [lookupState, setLookupState] = useState<'loading' | 'done' | 'failed'>('loading');
  /** Bumped by Try again to re-run the fetch effect. */
  const [retryNonce, setRetryNonce] = useState(0);

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
    let cancelled = false;
    setLookupState('loading');
    void fetchTenantOutgoingInspection(id)
      .then((detail) => {
        if (cancelled) return;
        setLoadedReport(toOutgoingReport(detail));
        setLookupState('done');
      })
      .catch(() => {
        if (cancelled) return;
        setLoadedReport(null);
        setLookupState('failed');
      });
    return () => {
      cancelled = true;
    };
    // Depends only on the id (and an explicit retry). Deriving the deps from state this effect
    // itself sets would tear the effect down and cancel the in-flight request before it resolved
    // — the detail came back 200 and was thrown away, leaving the empty list summary on screen.
  }, [id, retryNonce]);

  const retry = () => setRetryNonce((n) => n + 1);

  // Anything cached (summary or the provider's current report) renders straight away, even while
  // the fuller fetch is still in flight.
  if (!report && lookupState !== 'failed') {
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

      {report.reportUrl ? (
        <a
          href={report.reportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm font-medium hover:bg-secondary/40"
        >
          <FileText className="text-primary size-4 shrink-0" />
          <span className="min-w-0 flex-1">View / download outgoing report (PDF)</span>
          <ExternalLink className="text-muted-foreground size-3.5 shrink-0" />
        </a>
      ) : (
        <div className="text-muted-foreground mb-4 rounded-xl border border-dashed px-4 py-3 text-xs">
          Full PDF will appear here once the inspector report is generated. You can still review
          each section below.
        </div>
      )}

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
