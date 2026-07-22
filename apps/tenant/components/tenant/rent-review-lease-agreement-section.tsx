'use client';

import { useState } from 'react';
import { CheckCircle2, Download, FileText, PenLine } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { tenantRentReviewLeaseAgreementPdfUrl } from '@/lib/crossub-api/tenant-account-client';
import type { RentReviewCase } from '@/lib/types';

import { RentReviewLeaseAgreementPdfDialog } from './rent-review-lease-agreement-pdf-dialog';

function isFixedTermLeaseReview(review: RentReviewCase): boolean {
  const terms = review.noticeTerms;
  return (
    terms?.leaseAgreementPdfAvailable === true ||
    terms?.requiresLeaseAgreementSign === true ||
    terms?.leaseType === 'fixed'
  );
}

function StepBadge({
  step,
  done,
  active,
}: {
  step: number;
  done?: boolean;
  active?: boolean;
}) {
  return (
    <span
      className={
        done
          ? 'flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white'
          : active
            ? 'flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground'
            : 'flex size-6 shrink-0 items-center justify-center rounded-full border bg-muted text-xs font-semibold text-muted-foreground'
      }
    >
      {done ? <CheckCircle2 className="size-3.5" /> : step}
    </span>
  );
}

export function RentReviewLeaseAgreementSection({
  review,
  busy = false,
  onSignLeaseAgreement,
}: {
  review: RentReviewCase;
  busy?: boolean;
  onSignLeaseAgreement?: () => Promise<void>;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [signedOpen, setSignedOpen] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signedRevision, setSignedRevision] = useState<number | null>(null);

  if (!isFixedTermLeaseReview(review)) return null;

  const terms = review.noticeTerms;
  const leaseSigned = terms?.leaseAgreementSigned === true;
  const canSign =
    review.status === 'pending' && !leaseSigned && Boolean(onSignLeaseAgreement);
  const reviewShortId = review.id.slice(0, 8);

  const unsignedPdfUrl = tenantRentReviewLeaseAgreementPdfUrl(review.id);
  const signedPdfUrl = tenantRentReviewLeaseAgreementPdfUrl(review.id, {
    cacheBuster: signedRevision ?? 'signed',
  });

  const handleSign = async () => {
    if (!onSignLeaseAgreement) return;
    setSigning(true);
    try {
      await onSignLeaseAgreement();
      const revision = Date.now();
      setSignedRevision(revision);
      setPreviewOpen(false);
      setSignedOpen(true);
      toast.success('Agreement signed', {
        description: 'Your signature has been applied. Review the signed PDF, then accept the rent increase.',
      });
    } catch {
      toast.error('Could not sign the agreement');
    } finally {
      setSigning(false);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <div>
        <p className="text-sm font-semibold">Lease extension agreement</p>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          Your property manager prepared this NSW residential tenancy agreement in the agent
          portal. The landlord and managing agent have already signed — review the pre-signed
          document, add your signature, then accept the rent increase.
        </p>
      </div>

      {/* Step 1 — preview pre-signed agreement (landlord + agent only) */}
      <div className="flex gap-3 rounded-xl border bg-background/80 p-3">
        <StepBadge step={1} done={leaseSigned} active={!leaseSigned} />
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-sm font-medium">Review the agreement</p>
            <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
              {leaseSigned
                ? 'You reviewed the pre-signed agreement from your property manager.'
                : 'Preview or download the agreement with landlord and agent signatures. Your tenant signature is not included yet.'}
            </p>
          </div>
          {!leaseSigned ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 sm:flex-1"
                disabled={busy}
                onClick={() => setPreviewOpen(true)}
              >
                <FileText className="size-4" />
                Preview agreement
              </Button>
              <Button asChild variant="outline" className="w-full gap-2 sm:flex-1" disabled={busy}>
                <a
                  href={unsignedPdfUrl}
                  download={`lease-agreement-presigned-${reviewShortId}.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="size-4" />
                  Download
                </a>
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Step 2 — sign (tenant signature only) */}
      {canSign ? (
        <div className="flex gap-3 rounded-xl border border-dashed border-primary/40 bg-background/80 p-3">
          <StepBadge step={2} active />
          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <p className="text-sm font-medium">Sign the agreement</p>
              <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                After reviewing the pre-signed PDF, sign to apply your name to the tenant
                signature and tenant information statement sections only.
              </p>
            </div>
            <Button
              type="button"
              className="w-full gap-2 sm:w-auto"
              disabled={busy || signing}
              onClick={() => void handleSign()}
            >
              <PenLine className="size-4" />
              {signing ? 'Signing…' : 'Sign agreement'}
            </Button>
          </div>
        </div>
      ) : leaseSigned ? (
        <div className="flex gap-3 rounded-xl border bg-background/80 p-3 opacity-90">
          <StepBadge step={2} done />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Agreement signed</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Your tenant signature has been applied to the agreement.
            </p>
          </div>
        </div>
      ) : null}

      {/* Step 3 — signed document + accept path unlocked */}
      {leaseSigned ? (
        <div className="flex gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
          <StepBadge step={3} done active />
          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <p className="text-sm font-medium text-emerald-950 dark:text-emerald-50">
                Signed agreement ready
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                Your tenant signature has been applied. Preview or download the fully signed
                document, then accept the rent increase below.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 border-emerald-500/40 sm:flex-1"
                disabled={busy}
                onClick={() => setSignedOpen(true)}
              >
                <FileText className="size-4" />
                View signed agreement
              </Button>
              <Button asChild variant="outline" className="w-full gap-2 sm:flex-1" disabled={busy}>
                <a
                  href={signedPdfUrl}
                  download={`lease-agreement-signed-${reviewShortId}.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="size-4" />
                  Download signed PDF
                </a>
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <RentReviewLeaseAgreementPdfDialog
        title="Lease agreement — landlord & agent signed"
        pdfUrl={unsignedPdfUrl}
        downloadFileName={`lease-agreement-presigned-${reviewShortId}.pdf`}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />

      <RentReviewLeaseAgreementPdfDialog
        title="Signed lease agreement"
        pdfUrl={signedPdfUrl}
        downloadFileName={`lease-agreement-signed-${reviewShortId}.pdf`}
        open={signedOpen}
        onOpenChange={setSignedOpen}
      />
    </section>
  );
}
