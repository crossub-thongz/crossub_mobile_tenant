'use client';

import { Download, Eye } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { DocumentUploadProgress } from '@/components/tenant/document-upload-progress';
import { FileUploadField } from '@/components/tenant/file-upload-field';
import { NoImageDialog } from '@/components/tenant/no-image-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';
import {
  recordAgreementSigning,
  submitAgreementSigned,
  submitBondProof,
  submitDepositProof,
  submitKeyCollection,
  TENANT_LEASING_AGREEMENT_PDF_URL,
  uploadAgreementSignedFileWithProgress,
  uploadKeyCollectionPhotos,
  uploadPaymentProofFileWithProgress,
} from '@/lib/crossub-api/tenant-leasing-client';
import { isAllowedPaymentProofMimeType, resolvePaymentProofMimeType } from '@/lib/utils';
import { PAYMENT_STEP_COPY } from '@/lib/onboarding-payment-copy';
import { formatCurrency, formatDate, formatDateTime, formatOpenInspectionWindow } from '@/lib/utils';

export default function OnboardingStepPage() {
  const { step: stepId } = useParams<{ step: string }>();
  const { onboardingSteps, leasingOnboarding, refreshLeasingOnboarding } = useTenantData();
  const step = onboardingSteps.find((s) => s.id === stepId);
  const [file, setFile] = useState<File | null>(null);
  const [keyPhoto, setKeyPhoto] = useState<File | null>(null);
  const [keyTime, setKeyTime] = useState('');
  const [keyLocation, setKeyLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadPhase, setUploadPhase] = useState<'preparing' | 'uploading' | 'submitting' | null>(
    null,
  );
  const [agreementPreviewOpen, setAgreementPreviewOpen] = useState(false);
  const [signedPreviewOpen, setSignedPreviewOpen] = useState(false);
  const [noImageOpen, setNoImageOpen] = useState(false);

  const isKeyPickup = stepId === 'key_pickup';
  const keyCollection = leasingOnboarding?.keyCollection;
  const scheduledTime = keyCollection?.time ?? null;
  const scheduledTimeEnd = keyCollection?.timeEnd ?? null;
  const scheduledLocation = keyCollection?.location?.trim() ?? '';
  const agentScheduled = Boolean(scheduledTime || scheduledLocation);
  const tenantProofSubmitted = (keyCollection?.photos?.length ?? 0) > 0;
  const keyCollectionLocked = tenantProofSubmitted;
  const scheduleFingerprint = useMemo(
    () => [scheduledTime, scheduledTimeEnd, scheduledLocation].join('\u0001'),
    [scheduledTime, scheduledTimeEnd, scheduledLocation],
  );
  const [agentScheduleUpdated, setAgentScheduleUpdated] = useState(false);
  const scheduleWindow = scheduledTime
    ? formatOpenInspectionWindow(scheduledTime, scheduledTimeEnd ?? undefined) ??
      formatDateTime(scheduledTime)
    : null;

  useEffect(() => {
    if (!isKeyPickup) return;
    void refreshLeasingOnboarding();
  }, [isKeyPickup, refreshLeasingOnboarding]);

  useEffect(() => {
    if (!isKeyPickup || !leasingOnboarding) return;
    if (leasingOnboarding.keyCollection.time) {
      const d = new Date(leasingOnboarding.keyCollection.time);
      if (!Number.isNaN(d.getTime())) {
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000)
          .toISOString()
          .slice(0, 16);
        setKeyTime(local);
      }
    }
    if (leasingOnboarding.keyCollection.location) {
      setKeyLocation(leasingOnboarding.keyCollection.location);
    }
  }, [isKeyPickup, leasingOnboarding]);

  useEffect(() => {
    if (!isKeyPickup || !agentScheduled || !leasingOnboarding?.cycleId) {
      setAgentScheduleUpdated(false);
      return;
    }
    const storageKey = `tenant-key-schedule:${leasingOnboarding.cycleId}`;
    const seen = sessionStorage.getItem(storageKey);
    if (seen != null && seen !== scheduleFingerprint) {
      setAgentScheduleUpdated(true);
    } else {
      setAgentScheduleUpdated(false);
    }
    sessionStorage.setItem(storageKey, scheduleFingerprint);
  }, [isKeyPickup, agentScheduled, leasingOnboarding?.cycleId, scheduleFingerprint]);

  if (!step) {
    return (
      <TenantShell title="Onboarding" backHref={ROUTES.ONBOARDING}>
        <p className="text-sm text-muted-foreground">Step not found.</p>
      </TenantShell>
    );
  }

  const isUpload = step.id === 'deposit' || step.id === 'bond';
  const isLease = step.id === 'lease_signing';
  const agreement = leasingOnboarding?.agreement;
  const agreementContract = agreement?.contract;
  const agreementRevisions = agreement?.revisions ?? [];
  const agreementAvailable = Boolean(agreement?.available);
  const agreementConfirmed = agreement?.signingStatus === 'signed';
  const agreementPendingConfirmation = agreement?.status === 'waiting';
  const agreementRejectReason = agreement?.rejectReason?.trim() ?? null;
  const agreementAckLocked = agreementConfirmed || agreementPendingConfirmation;
  const signedProofUrl = agreement?.signedProofUrl ?? null;
  const signedProofFileName = agreement?.signedProofFileName ?? null;
  const paymentCopy =
    step.id === 'deposit' || step.id === 'bond'
      ? PAYMENT_STEP_COPY[step.id]
      : null;
  const existingProof =
    step.id === 'deposit'
      ? leasingOnboarding?.depositProof
      : step.id === 'bond'
        ? leasingOnboarding?.bondProof
        : null;
  const depositStep = onboardingSteps.find((s) => s.id === 'deposit');
  const bondStep = onboardingSteps.find((s) => s.id === 'bond');
  const currentPaymentStep =
    step.id === 'deposit' ? depositStep : step.id === 'bond' ? bondStep : null;
  const proofPendingConfirmation = currentPaymentStep?.status === 'uploaded';
  const proofConfirmed = currentPaymentStep?.status === 'completed';
  const proofSubmitted = proofPendingConfirmation;
  const paymentProofLocked = proofSubmitted || proofConfirmed;

  const handlePaymentProofSubmit = async () => {
    if (!file) {
      toast.error('Choose a file to upload');
      return;
    }
    const mimeType = resolvePaymentProofMimeType(file);
    if (!isAllowedPaymentProofMimeType(mimeType)) {
      toast.error('Upload a PDF or image file (screenshot or receipt)');
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);
    setUploadPhase('uploading');
    try {
      const proofUrl = await uploadPaymentProofFileWithProgress(
        step.id === 'deposit' ? 'deposit' : 'bond',
        file,
        mimeType,
        setUploadProgress,
      );
      setUploadPhase('submitting');
      setUploadProgress(95);
      if (step.id === 'deposit') {
        await submitDepositProof({ proofUrl, fileName: file.name });
      } else {
        await submitBondProof({ proofUrl, fileName: file.name });
      }
      setUploadProgress(100);
      await refreshLeasingOnboarding();
      setFile(null);
      toast.success('Proof submitted — pending agent confirmation', {
        description: file.name,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not upload proof');
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
      setUploadPhase(null);
    }
  };

  const handleAgreementUploadSubmit = async () => {
    if (!file) {
      toast.error('Choose your signed agreement to upload');
      return;
    }
    const mimeType = resolvePaymentProofMimeType(file);
    if (!isAllowedPaymentProofMimeType(mimeType)) {
      toast.error('Upload a PDF or image of your signed agreement');
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);
    setUploadPhase('uploading');
    try {
      const proofUrl = await uploadAgreementSignedFileWithProgress(file, mimeType, setUploadProgress);
      setUploadPhase('submitting');
      setUploadProgress(95);
      await submitAgreementSigned({ proofUrl, fileName: file.name });
      setUploadProgress(100);
      await refreshLeasingOnboarding();
      setFile(null);
      toast.success('Signed agreement submitted — pending agent confirmation', {
        description: file.name,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not upload signed agreement');
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
      setUploadPhase(null);
    }
  };

  const handleRecordAgreementSigning = async () => {
    setSubmitting(true);
    try {
      await recordAgreementSigning();
      await refreshLeasingOnboarding();
      toast.success('Agreement signed — pending agent confirmation');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not record agreement signing');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pickupTime = scheduledTime ?? (keyTime ? new Date(keyTime).toISOString() : '');
    const pickupLocation = scheduledLocation || keyLocation.trim();

    if (!agentScheduled && (!pickupTime || !pickupLocation)) {
      toast.error('Enter both pickup time and location');
      return;
    }

    if (agentScheduled && (!pickupTime || !pickupLocation)) {
      toast.error('Key collection details are not ready yet — check back once your agent has sent them');
      return;
    }

    const existingPhotos = keyCollection?.photos ?? [];
    if (!keyPhoto && existingPhotos.length === 0) {
      setNoImageOpen(true);
      toast.error('Add a photo of the keys as proof of collection');
      return;
    }

    setSubmitting(true);
    try {
      let photoUrls = existingPhotos;
      if (keyPhoto) {
        const uploaded = await uploadKeyCollectionPhotos([keyPhoto]);
        photoUrls = [...existingPhotos, ...uploaded].slice(0, 5);
      }

      await submitKeyCollection({
        time: pickupTime,
        location: pickupLocation,
        photoUrls,
      });
      await refreshLeasingOnboarding();
      setKeyPhoto(null);
      toast.success('Key collection report saved — your agent has been notified');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save key collection');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TenantShell title={step.title} backHref={ROUTES.ONBOARDING}>
      {paymentCopy && (
        <p className="text-muted-foreground mb-4 text-sm leading-relaxed">{paymentCopy.summary}</p>
      )}
      {!paymentCopy && (
        <p className="text-muted-foreground mb-4 text-sm">{step.description}</p>
      )}

      {leasingOnboarding && (
        <p className="text-muted-foreground mb-4 text-xs">
          {leasingOnboarding.propertyAddress} · Leasing status:{' '}
          {onboardingSteps.length > 0 &&
          onboardingSteps.every((s) => s.status === 'completed')
            ? 'Completed'
            : leasingOnboarding.lifecycleStep.replace(/_/g, ' ')}
        </p>
      )}

      {step.amount != null && (
        <div className="mb-4 rounded-xl border bg-card p-4">
          <p className="text-muted-foreground text-xs font-medium uppercase">Amount due</p>
          <p className="text-primary text-2xl font-semibold">{formatCurrency(step.amount)}</p>
          {step.dueAt && (
            <p className="text-muted-foreground mt-1 text-sm">Due {formatDate(step.dueAt)}</p>
          )}
        </div>
      )}

      {isUpload && paymentCopy && (
        <div className="space-y-5">
          <ul className="text-muted-foreground list-disc space-y-1.5 pl-4 text-sm">
            {paymentCopy.instructions.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>

          {paymentCopy.faq && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
              <p className="font-medium text-foreground">{paymentCopy.faq.question}</p>
              <p className="text-muted-foreground mt-2 leading-relaxed">{paymentCopy.faq.answer}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Payment account details — confirm exact wording and destination with Leasing/Fay (RBO or
            designated statutory process).
          </p>

          {proofConfirmed ? (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm">
              <p className="font-medium text-emerald-950 dark:text-emerald-100">Confirmed</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Your agent has confirmed this step. You can continue with the next onboarding
                items.
              </p>
              {existingProof?.proofUrl ? (
                <a
                  href={existingProof.proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary mt-2 inline-block text-xs font-medium underline"
                >
                  View uploaded document
                </a>
              ) : null}
            </div>
          ) : null}

          {proofSubmitted && (existingProof?.proofUrl || existingProof?.fileName) ? (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
              <p className="font-medium text-amber-950 dark:text-amber-100">Pending confirmation</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {existingProof?.fileName ?? 'Payment proof'} has been submitted. Your agent will
                confirm once reviewed.
              </p>
              {existingProof?.proofUrl ? (
                <a
                  href={existingProof.proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary mt-2 inline-block text-xs font-medium underline"
                >
                  View uploaded document
                </a>
              ) : null}
            </div>
          ) : null}

          {!paymentProofLocked ? (
            <>
              <FileUploadField accept="image/*,.pdf" onFileSelect={setFile} />

              {submitting && uploadProgress != null ? (
                <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-3">
                  <DocumentUploadProgress
                    percent={uploadProgress}
                    label={
                      uploadPhase === 'submitting'
                        ? 'Submitting proof'
                        : 'Uploading proof'
                    }
                  />
                  <p className="text-muted-foreground mt-2 text-xs">
                    Large files can take a minute — keep this tab open until the upload finishes.
                  </p>
                </div>
              ) : null}

              <Button
                className="w-full"
                disabled={!file || submitting}
                onClick={() => void handlePaymentProofSubmit()}
              >
                {submitting ? 'Uploading…' : 'Submit proof'}
              </Button>
            </>
          ) : null}
        </div>
      )}

      {isLease && (
        <div className="space-y-4">
          {agreementAvailable ? (
            <>
              <div className="rounded-xl border bg-card p-4 text-sm">
                <p className="font-medium">Lease agreement</p>
                {agreementContract?.contractRef && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    Reference: {agreementContract.contractRef}
                    {agreementContract.currentVersion != null
                      ? ` · version ${agreementContract.currentVersion}`
                      : ''}
                  </p>
                )}
                {agreementContract?.template && (
                  <p className="text-muted-foreground mt-1 text-xs">{agreementContract.template}</p>
                )}
                <div className="text-muted-foreground mt-3 grid gap-2 text-xs">
                  {agreementContract?.leaseTerm && (
                    <p>
                      <span className="text-foreground font-medium">Term:</span>{' '}
                      {agreementContract.leaseTerm}
                    </p>
                  )}
                  {agreementContract?.weeklyRent != null && (
                    <p>
                      <span className="text-foreground font-medium">Rent:</span>{' '}
                      {formatCurrency(agreementContract.weeklyRent)}/week
                    </p>
                  )}
                  {agreement?.uploadedFileName && (
                    <p>
                      <span className="text-foreground font-medium">File:</span>{' '}
                      {agreement.uploadedFileName}
                    </p>
                  )}
                </div>
              </div>

              {agreementRevisions.length > 0 ? (
                <div className="rounded-xl border bg-card p-4 text-sm">
                  <p className="font-medium">Agreement versions</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Your agent may issue updated versions during onboarding. The current version is
                    marked below.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {[...agreementRevisions].reverse().map((revision) => (
                      <li
                        key={`${revision.contractRef}-${revision.version}`}
                        className="rounded-lg border bg-muted/20 px-3 py-2 text-xs"
                      >
                        <p className="font-medium text-foreground">
                          {revision.contractRef}
                          {revision.isCurrent ? ' · Current' : ' · Superseded'}
                        </p>
                        <p className="text-muted-foreground mt-1">
                          {[
                            revision.leaseTerm,
                            revision.weeklyRent != null
                              ? `${formatCurrency(revision.weeklyRent)}/week`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setAgreementPreviewOpen((open) => !open)}
                >
                  <Eye className="size-4" />
                  {agreementPreviewOpen ? 'Hide preview' : 'Preview'}
                </Button>
                <Button asChild className="flex-1">
                  <a
                    href={TENANT_LEASING_AGREEMENT_PDF_URL}
                    download="tenancy-agreement.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="size-4" />
                    Download
                  </a>
                </Button>
              </div>

              {agreementPreviewOpen ? (
                <div className="overflow-hidden rounded-xl border bg-muted/30">
                  <iframe
                    title="Lease agreement preview"
                    src={TENANT_LEASING_AGREEMENT_PDF_URL}
                    className="h-[min(70vh,560px)] w-full bg-white"
                  />
                </div>
              ) : null}

              {!agreementAckLocked ? (
                <>
                  {agreementRejectReason ? (
                    <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
                      <p className="font-medium text-destructive">Submission declined</p>
                      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                        {agreementRejectReason}
                      </p>
                      <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                        Please upload a corrected signed agreement below.
                      </p>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <FileUploadField
                      accept="image/*,.pdf"
                      label="Upload signed agreement"
                      hint="Upload the signed lease agreement (PDF or photo)"
                      footer="PDF or image · max 10 MB recommended"
                      onFileSelect={setFile}
                    />
                    {uploadProgress != null ? (
                      <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-3">
                        <DocumentUploadProgress
                          percent={uploadProgress}
                          label={
                            uploadPhase === 'submitting'
                              ? 'Submitting signed agreement'
                              : 'Uploading signed agreement'
                          }
                        />
                      </div>
                    ) : null}
                  </div>

                  <Button
                    className="w-full"
                    disabled={!file || submitting}
                    onClick={() => void handleAgreementUploadSubmit()}
                  >
                    {submitting ? 'Uploading…' : 'Submit signed agreement'}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background text-muted-foreground px-2">Or</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={submitting}
                    onClick={() => void handleRecordAgreementSigning()}
                  >
                    {submitting ? 'Recording…' : 'Record signing (use my name on the agreement)'}
                  </Button>
                </>
              ) : null}

              {agreementPendingConfirmation && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
                  <p className="font-medium text-amber-950 dark:text-amber-100">
                    Pending confirmation
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    Your signed agreement has been submitted. Your agent will confirm once reviewed.
                  </p>
                </div>
              )}

              {signedProofUrl ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setSignedPreviewOpen((open) => !open)}
                    >
                      <Eye className="size-4" />
                      {signedPreviewOpen ? 'Hide signed copy' : 'Preview signed copy'}
                    </Button>
                    <Button asChild className="flex-1">
                      <a
                        href={signedProofUrl}
                        download={signedProofFileName ?? 'signed-agreement.pdf'}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="size-4" />
                        Download signed
                      </a>
                    </Button>
                  </div>
                  {signedPreviewOpen ? (
                    <div className="overflow-hidden rounded-xl border bg-muted/30">
                      <iframe
                        title="Signed lease agreement"
                        src={signedProofUrl}
                        className="h-[min(70vh,560px)] w-full bg-white"
                      />
                    </div>
                  ) : null}
                </>
              ) : null}

              {agreementConfirmed ? (
                <Button className="w-full" disabled>
                  Agreement confirmed
                </Button>
              ) : agreementPendingConfirmation ? (
                <Button className="w-full" disabled>
                  Pending agent confirmation
                </Button>
              ) : null}
            </>
          ) : (
            <div className="rounded-xl border border-dashed bg-card p-4 text-sm">
              <p className="font-medium">Lease agreement not ready yet</p>
              <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                CROSSUB will generate and send your agreement after earlier onboarding items are
                complete. Check back here once your agent has sent it.
              </p>
            </div>
          )}
        </div>
      )}

      {isKeyPickup && (
        <form className="space-y-4" onSubmit={handleKeySubmit}>
          {keyCollectionLocked ? (
            <p className="text-muted-foreground text-sm">
              Your key collection report has been submitted. Contact your agent if you need to
              change anything.
            </p>
          ) : agentScheduled ? (
            <p className="text-muted-foreground text-sm">
              Your agent has arranged key collection. Confirm the details below and upload a photo
              when you have the keys.
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              Your agent has not sent key collection details yet. Enter when and where you will pick
              up the keys, or check back once they have scheduled it.
            </p>
          )}

          {agentScheduleUpdated && agentScheduled ? (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
              <p className="font-medium text-amber-950 dark:text-amber-100">
                Key collection details updated
              </p>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                Your agent changed the pickup date, time, or location. Review the details below.
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="keyLocation">Pickup location</Label>
            <Input
              id="keyLocation"
              disabled={agentScheduled}
              readOnly={agentScheduled}
              required={!agentScheduled}
              className={agentScheduled ? 'bg-muted/40 disabled:opacity-100' : undefined}
              placeholder={
                agentScheduled
                  ? undefined
                  : leasingOnboarding?.keyCustody === 'crossub'
                    ? 'CROSSUB office address'
                    : 'Agent office or property address'
              }
              value={agentScheduled ? scheduledLocation : keyLocation}
              onChange={(e) => setKeyLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keyTime">Pickup date & time</Label>
            <Input
              id="keyTime"
              type={agentScheduled ? 'text' : 'datetime-local'}
              disabled={agentScheduled}
              readOnly={agentScheduled}
              required={!agentScheduled}
              className={agentScheduled ? 'bg-muted/40 disabled:opacity-100' : undefined}
              placeholder={agentScheduled ? 'Not set' : undefined}
              value={
                agentScheduled
                  ? scheduleWindow ?? (scheduledTime ? formatDateTime(scheduledTime) : '')
                  : keyTime
              }
              onChange={(e) => setKeyTime(e.target.value)}
            />
          </div>

          {tenantProofSubmitted && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
              <p className="font-medium">Key collection report submitted</p>
              <p className="text-muted-foreground mt-1">
                {scheduleWindow}
                {scheduledLocation ? ` · ${scheduledLocation}` : ''}
              </p>
            </div>
          )}

          {keyCollection?.photos && keyCollection.photos.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Key collection proof</p>
              <div className="flex flex-wrap gap-2">
                {keyCollection.photos.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-lg border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt="Key collection proof"
                      className="size-20 object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {!keyCollectionLocked ? (
            <div className="space-y-2">
              <Label>Key collection photo</Label>
              <p className="text-muted-foreground text-xs">
                {agentScheduled
                  ? 'Snap or upload a photo of the keys as proof that you collected them. At least one photo is required.'
                  : 'Snap or upload a photo of the keys as proof for your key collection report. At least one photo is required.'}
              </p>
              {!keyPhoto && (keyCollection?.photos?.length ?? 0) === 0 ? (
                <button
                  type="button"
                  className="border-border text-muted-foreground flex w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-3 py-5"
                  onClick={() => setNoImageOpen(true)}
                >
                  <span className="text-[10px] font-bold tracking-wide">NO IMAGE</span>
                  <span className="text-[11px]">Add at least one photo</span>
                </button>
              ) : null}
              <FileUploadField
                accept="image/*"
                capture="environment"
                label="Snap or upload key photo"
                hint="Use your camera or choose from your gallery"
                footer="Image · max 10 MB recommended"
                onFileSelect={setKeyPhoto}
              />
            </div>
          ) : null}

          {!keyCollectionLocked ? (
            <Button
              type="submit"
              className="w-full"
              disabled={
                submitting ||
                (!agentScheduled && (!keyTime || !keyLocation.trim())) ||
                (agentScheduled && !scheduledTime && !scheduledLocation) ||
                (!keyPhoto && (keyCollection?.photos?.length ?? 0) === 0)
              }
            >
              {submitting ? 'Saving…' : 'Submit key collection report'}
            </Button>
          ) : null}
        </form>
      )}

      {step.id === 'account_setup' && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success('Profile confirmed — account linked to lease');
          }}
        >
          <p className="text-sm text-muted-foreground">
            Confirm your details and link this login to your property/lease record.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone</label>
            <input
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
              type="tel"
              placeholder="+61 ..."
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm email</label>
            <input
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
              type="email"
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" required className="accent-primary size-4" />
            I confirm this account is for my approved tenancy
            {leasingOnboarding ? ` at ${leasingOnboarding.propertyAddress}` : ''}
          </label>
          <Button type="submit" className="w-full">
            Complete account setup
          </Button>
        </form>
      )}

      <NoImageDialog
        open={noImageOpen}
        onClose={() => setNoImageOpen(false)}
        message="Add at least one photo of the keys before submitting your collection report."
      />
    </TenantShell>
  );
}
