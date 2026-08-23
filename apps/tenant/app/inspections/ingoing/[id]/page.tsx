'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ExternalLink, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { StatusBadge } from '@/components/tenant/status-badge';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { fetchTenantIngoingInspection } from '@/lib/crossub-api/tenant-account-client';
import { toIngoingReport } from '@/lib/crossub-api/tenant-mappers';
import { resolveBackHref } from '@/lib/back-navigation';
import { INGOING_STATUS_LABEL } from '@/lib/tenant-labels';
import { fileToBase64, formatDate } from '@/lib/utils';

export default function IngoingReportPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const backHref = resolveBackHref(searchParams.get('from'), ROUTES.INSPECTIONS);
  const { ingoingReport, submitIngoingReturnedReport, apiConnected } = useTenantData();
  const [loadedReport, setLoadedReport] = useState(ingoingReport);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [signatureName, setSignatureName] = useState('');

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
  const waitingForAdmin =
    report?.status === 'awaiting_admin' || report?.released === false;
  const signingClosed = report?.status === 'overdue' || Boolean(report?.signingClosed);
  const submitted = Boolean(
    report?.tenantApproved ||
      report?.status === 'confirmed' ||
      report?.tenantReturnedReportUrl,
  );

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

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Upload your completed report PDF');
      return;
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Upload the completed report as a PDF');
      return;
    }
    if (signatureName.trim().length < 2) {
      toast.error('Enter your signature name');
      return;
    }
    setBusy(true);
    try {
      const contentBase64 = await fileToBase64(file);
      await submitIngoingReturnedReport(
        {
          fileName: file.name,
          mimeType: 'application/pdf',
          sizeBytes: file.size,
          contentBase64,
          signatureName: signatureName.trim(),
        },
        report.id,
      );
      toast.success('Signed report submitted');
      setFile(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not submit the report');
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
              : report.status === 'rejected' || report.status === 'overdue'
                ? 'danger'
                : report.status === 'awaiting_admin'
                  ? 'warning'
                  : 'action'
          }
        />
        {!waitingForAdmin && report.dueBy ? (
          <span className="text-muted-foreground text-xs">
            Due {formatDate(report.dueBy)}
          </span>
        ) : null}
      </div>

      {waitingForAdmin ? (
        <div className="rounded-xl border border-dashed px-4 py-4 text-sm">
          <p className="font-medium">Waiting for CROSSUB to send the inspector report</p>
          <p className="text-muted-foreground mt-1 text-xs">
            After CROSSUB approves and sends the report, check it, fill the required
            sections, sign it, and upload the completed copy here.
          </p>
        </div>
      ) : null}

      {signingClosed && !report.tenantApproved ? (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm">
          <p className="font-medium">Signing window closed</p>
          <p className="text-muted-foreground mt-1 text-xs">
            The 7-day return window has ended. This ingoing report can no longer
            be submitted.
          </p>
        </div>
      ) : null}

      {!waitingForAdmin && report.reportUrl ? (
        <a
          href={report.reportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm font-medium hover:bg-secondary/40"
        >
          <FileText className="text-primary size-4 shrink-0" />
          <span className="min-w-0 flex-1">1. Check the inspector report (PDF)</span>
          <ExternalLink className="text-muted-foreground size-3.5 shrink-0" />
        </a>
      ) : !waitingForAdmin ? (
        <div className="text-muted-foreground mb-4 rounded-xl border border-dashed px-4 py-3 text-xs">
          The inspector report PDF will appear here when it is ready.
        </div>
      ) : null}

      {!waitingForAdmin && report.tenantReturnedReportUrl ? (
        <a
          href={report.tenantReturnedReportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm font-medium hover:bg-secondary/40"
        >
          <FileText className="text-primary size-4 shrink-0" />
          <span className="min-w-0 flex-1">
            Your returned copy
            {report.tenantReturnedSignedName
              ? ` · signed by ${report.tenantReturnedSignedName}`
              : ''}
          </span>
          <ExternalLink className="text-muted-foreground size-3.5 shrink-0" />
        </a>
      ) : null}

      {!waitingForAdmin && !signingClosed && !submitted ? (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <p className="text-sm font-semibold">Return your completed report</p>
          <ol className="text-muted-foreground list-decimal space-y-1 pl-4 text-xs">
            <li>Open the inspector report and check it.</li>
            <li>Fill in the required sections on that report.</li>
            <li>Add your signature, then upload the completed PDF below.</li>
            <li>Submit it back to CROSSUB.</li>
          </ol>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium">Upload completed PDF</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="text-muted-foreground block w-full text-xs"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <p className="text-muted-foreground text-[11px]">{file.name}</p>
            ) : null}
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium">Signature name</span>
            <input
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Type your full name"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
            />
          </label>
          <Button
            size="sm"
            disabled={busy}
            onClick={() => void handleSubmit()}
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Submit report
          </Button>
        </div>
      ) : null}

      {submitted && !waitingForAdmin ? (
        <p className="text-muted-foreground text-xs">
          Your signed report has been submitted. CROSSUB and your agent can view
          both the inspector copy and your returned copy.
        </p>
      ) : null}
    </TenantShell>
  );
}
