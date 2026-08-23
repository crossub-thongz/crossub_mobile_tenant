'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ExternalLink, FileText, Loader2, Upload } from 'lucide-react';
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
import { cn, fileToBase64, formatDate } from '@/lib/utils';

export default function IngoingReportPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const backHref = resolveBackHref(searchParams.get('from'), ROUTES.INSPECTIONS);
  const { ingoingReport, submitIngoingReturnedReport, apiConnected } = useTenantData();
  const [loadedReport, setLoadedReport] = useState(ingoingReport);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const alreadyReturned = Boolean(report?.tenantReturnedReportUrl);

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
      toast.error('Choose the completed report PDF to re-upload');
      return;
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Upload the completed report as a PDF');
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
        },
        report.id,
      );
      toast.success(alreadyReturned ? 'Report re-uploaded' : 'Report submitted');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
            sections, then re-upload the completed PDF here.
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
          className="bg-primary text-primary-foreground mb-4 flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-sm"
        >
          <FileText className="size-5 shrink-0" />
          Check inspector report
          <ExternalLink className="size-4 shrink-0 opacity-90" />
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
          className="border-primary/40 bg-primary/10 text-primary mb-4 flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold"
        >
          <FileText className="size-5 shrink-0" />
          View your uploaded copy
          <ExternalLink className="size-4 shrink-0" />
        </a>
      ) : null}

      {!waitingForAdmin && !signingClosed ? (
        <div className="space-y-4 rounded-xl border-2 border-primary/25 bg-card p-4">
          <p className="text-base font-semibold">
            {alreadyReturned ? 'Re-upload your report' : 'Upload your completed report'}
          </p>
          <ol className="text-foreground/80 list-decimal space-y-1.5 pl-4 text-sm">
            <li>Open the inspector report and check it.</li>
            <li>Fill in the required sections on that report.</li>
            <li>Re-upload the completed PDF and submit it back to CROSSUB.</li>
          </ol>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            size="lg"
            variant={file ? 'secondary' : 'default'}
            className={cn(
              'h-12 w-full text-base font-semibold',
              !file && 'bg-primary text-primary-foreground shadow-md',
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-5" />
            {file ? 'Change PDF' : alreadyReturned ? 'Choose PDF to re-upload' : 'Choose PDF'}
          </Button>
          {file ? (
            <p className="text-center text-sm font-medium">{file.name}</p>
          ) : (
            <p className="text-muted-foreground text-center text-xs">
              PDF only · tap the button to select a file
            </p>
          )}

          <Button
            type="button"
            size="lg"
            className="bg-primary text-primary-foreground h-12 w-full text-base font-semibold shadow-md"
            disabled={busy || !file}
            onClick={() => void handleSubmit()}
          >
            {busy ? <Loader2 className="size-5 animate-spin" /> : null}
            {alreadyReturned ? 'Re-upload report' : 'Submit report'}
          </Button>
        </div>
      ) : null}

      {alreadyReturned && !waitingForAdmin && signingClosed ? (
        <p className="text-muted-foreground text-xs">
          Your report has been submitted. CROSSUB and your agent can view both
          the inspector copy and your returned copy.
        </p>
      ) : null}
    </TenantShell>
  );
}
