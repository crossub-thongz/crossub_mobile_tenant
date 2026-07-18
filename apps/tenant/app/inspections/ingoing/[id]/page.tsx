'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ExternalLink, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { ReportSectionCard } from '@/components/tenant/report-section-card';
import { StatusBadge } from '@/components/tenant/status-badge';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { Button } from '@/components/ui/button';
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
  const {
    ingoingReport,
    confirmIngoingSection,
    approveIngoingReport,
    rejectIngoingReport,
    apiConnected,
  } = useTenantData();
  const [loadedReport, setLoadedReport] = useState(ingoingReport);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

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

  const sectionsReady = useMemo(() => {
    if (!report?.sections.length) return true;
    return report.sections.every((s) => s.tenantConfirmed || s.tenantDispute);
  }, [report]);

  const locked =
    report?.status === 'confirmed' ||
    report?.status === 'rejected' ||
    Boolean(report?.tenantApproved) ||
    Boolean(report?.tenantRejected);

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

  const handleApprove = async () => {
    if (!sectionsReady) {
      toast.error('Confirm or dispute every section before approving');
      return;
    }
    setBusy(true);
    try {
      await approveIngoingReport(report.id);
      toast.success('Ingoing report approved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not approve report');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    const reason = rejectReason.trim();
    if (reason.length < 3) {
      toast.error('Enter a reason for rejecting the report');
      return;
    }
    setBusy(true);
    try {
      await rejectIngoingReport(reason, report.id);
      toast.success('Ingoing report rejected — your agent has been notified');
      setRejectOpen(false);
      setRejectReason('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not reject report');
    } finally {
      setBusy(false);
    }
  };

  return (
    <TenantShell title="Ingoing report" backHref={backHref}>
      <p className="text-muted-foreground mb-2 text-sm">{report.propertyAddress}</p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge
          label={INGOING_STATUS_LABEL[report.status]}
          variant={
            report.status === 'confirmed'
              ? 'success'
              : report.status === 'rejected'
                ? 'danger'
                : 'action'
          }
        />
        <span className="text-muted-foreground text-xs">
          Due {formatDate(report.dueBy)} · {report.confirmedCount}/{total} reviewed
        </span>
      </div>

      {report.reportUrl ? (
        <a
          href={report.reportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm font-medium hover:bg-secondary/40"
        >
          <FileText className="text-primary size-4 shrink-0" />
          <span className="min-w-0 flex-1">View / download ingoing report (PDF)</span>
          <ExternalLink className="text-muted-foreground size-3.5 shrink-0" />
        </a>
      ) : (
        <div className="text-muted-foreground mb-4 rounded-xl border border-dashed px-4 py-3 text-xs">
          Full PDF will appear here once the inspector report is generated. You can still review
          each section below.
        </div>
      )}

      {report.status === 'rejected' && report.rejectReason ? (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <p className="font-medium">You rejected this report</p>
          <p className="text-muted-foreground mt-1 text-xs">{report.rejectReason}</p>
        </div>
      ) : null}

      <p className="text-muted-foreground mb-4 text-xs">
        Review each section, leave feedback if needed, then Confirm or Dispute. When every section
        is reviewed, Approve the whole report — or Reject it with a reason.
      </p>

      <div className="space-y-4">
        {report.sections.map((section) => (
          <ReportSectionCard
            key={section.id}
            section={section}
            disabled={locked || busy}
            onConfirm={(feedback) =>
              void confirmIngoingSection(section.id, {
                feedback,
                inspectionId: report.id,
              }).catch((err) =>
                toast.error(err instanceof Error ? err.message : 'Could not confirm section'),
              )
            }
            onDispute={(comment) =>
              void confirmIngoingSection(section.id, {
                dispute: comment,
                inspectionId: report.id,
              }).catch((err) =>
                toast.error(err instanceof Error ? err.message : 'Could not dispute section'),
              )
            }
          />
        ))}
      </div>

      {!locked ? (
        <div className="mt-6 space-y-3 rounded-xl border bg-card p-4">
          <p className="text-sm font-semibold">Acknowledge report</p>
          <p className="text-muted-foreground text-xs">
            {sectionsReady
              ? 'All sections reviewed. Approve to accept the condition report, or reject with a reason.'
              : `Review remaining sections (${total - report.confirmedCount} left) before approving.`}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={busy || !sectionsReady}
              onClick={() => void handleApprove()}
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Approve report
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => setRejectOpen((v) => !v)}
            >
              Reject report
            </Button>
          </div>
          {rejectOpen ? (
            <div className="space-y-2 border-t pt-3">
              <textarea
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                placeholder="State your reason for rejecting the report"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
              <Button
                size="sm"
                variant="destructive"
                disabled={busy}
                onClick={() => void handleReject()}
              >
                Confirm rejection
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </TenantShell>
  );
}
