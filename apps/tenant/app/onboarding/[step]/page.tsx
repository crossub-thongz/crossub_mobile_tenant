'use client';

import { Calendar, Download, MapPin } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { FileUploadField } from '@/components/tenant/file-upload-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';
import {
  submitBondProof,
  submitDepositProof,
  submitKeyCollection,
  TENANT_LEASING_AGREEMENT_PDF_URL,
  uploadBondProofPhoto,
  uploadDepositProofPhoto,
  uploadKeyCollectionPhotos,
} from '@/lib/crossub-api/tenant-leasing-client';
import { fileToBase64 } from '@/lib/utils';
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

  const isKeyPickup = stepId === 'key_pickup';
  const keyCollection = leasingOnboarding?.keyCollection;
  const scheduledTime = keyCollection?.time ?? null;
  const scheduledTimeEnd = keyCollection?.timeEnd ?? null;
  const scheduledLocation = keyCollection?.location?.trim() ?? '';
  const agentScheduled = Boolean(scheduledTime || scheduledLocation);
  const tenantProofSubmitted = (keyCollection?.photos?.length ?? 0) > 0;
  const scheduleWindow = scheduledTime
    ? formatOpenInspectionWindow(scheduledTime, scheduledTimeEnd ?? undefined) ??
      formatDateTime(scheduledTime)
    : null;

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
  const agreementAvailable = Boolean(agreement?.available);
  const agreementSigned = agreement?.signingStatus === 'signed';
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
  const proofSubmitted = Boolean(existingProof?.proofUrl);

  const handlePaymentProofSubmit = async () => {
    if (!file) {
      toast.error('Choose a file to upload');
      return;
    }
    setSubmitting(true);
    try {
      const contentBase64 = await fileToBase64(file);
      const upload = {
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        contentBase64,
      };
      const proofUrl =
        step.id === 'deposit'
          ? await uploadDepositProofPhoto(upload)
          : await uploadBondProofPhoto(upload);
      if (step.id === 'deposit') {
        await submitDepositProof({ proofUrl, fileName: file.name });
      } else {
        await submitBondProof({ proofUrl, fileName: file.name });
      }
      await refreshLeasingOnboarding();
      setFile(null);
      toast.success('Proof uploaded — pending CROSSUB approval', {
        description: file.name,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not upload proof');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pickupTime = scheduledTime ?? (keyTime ? new Date(keyTime).toISOString() : '');
    const pickupLocation = scheduledLocation || keyLocation.trim();

    if (!pickupTime || !pickupLocation) {
      toast.error('Enter both pickup time and location');
      return;
    }

    const existingPhotos = keyCollection?.photos ?? [];
    if (!keyPhoto && existingPhotos.length === 0) {
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
          {leasingOnboarding.lifecycleStep.replace(/_/g, ' ')}
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

          {proofSubmitted && existingProof?.proofUrl && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
              <p className="font-medium">Proof submitted</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {existingProof.fileName ?? 'Payment proof'} — awaiting CROSSUB approval.
              </p>
              <a
                href={existingProof.proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary mt-2 inline-block text-xs font-medium underline"
              >
                View uploaded document
              </a>
            </div>
          )}

          <FileUploadField accept="image/*,.pdf" onFileSelect={setFile} />

          <Button
            className="w-full"
            disabled={!file || submitting}
            onClick={() => void handlePaymentProofSubmit()}
          >
            {submitting ? 'Uploading…' : proofSubmitted ? 'Replace proof' : 'Submit proof'}
          </Button>
        </div>
      )}

      {isLease && (
        <div className="space-y-4">
          {agreementAvailable ? (
            <>
              <div className="rounded-xl border bg-card p-4 text-sm">
                <p className="font-medium">Lease agreement</p>
                {agreement?.contract.template && (
                  <p className="text-muted-foreground mt-1 text-xs">{agreement.contract.template}</p>
                )}
                <div className="text-muted-foreground mt-3 grid gap-2 text-xs">
                  {agreement?.contract.leaseTerm && (
                    <p>
                      <span className="text-foreground font-medium">Term:</span>{' '}
                      {agreement.contract.leaseTerm}
                    </p>
                  )}
                  {agreement?.contract.weeklyRent != null && (
                    <p>
                      <span className="text-foreground font-medium">Rent:</span>{' '}
                      {formatCurrency(agreement.contract.weeklyRent)}/week
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

              <div className="overflow-hidden rounded-xl border bg-muted/30">
                <iframe
                  title="Lease agreement"
                  src={TENANT_LEASING_AGREEMENT_PDF_URL}
                  className="h-[min(70vh,560px)] w-full bg-white"
                />
              </div>

              <p className="text-muted-foreground text-xs">
                If the preview does not load on your device, use Download or Open in browser.
              </p>

              <div className="flex flex-wrap gap-2">
                <Button asChild className="flex-1">
                  <a
                    href={TENANT_LEASING_AGREEMENT_PDF_URL}
                    download="tenancy-agreement.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="size-4" />
                    Download PDF
                  </a>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <a
                    href={TENANT_LEASING_AGREEMENT_PDF_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in browser
                  </a>
                </Button>
              </div>

              <Button
                className="w-full"
                disabled={agreementSigned}
                onClick={() =>
                  toast.success(
                    agreementSigned
                      ? 'Agreement already marked as signed'
                      : 'Lease marked as signed — your agent will confirm on their side',
                  )
                }
              >
                {agreementSigned ? 'Agreement signed' : 'I have signed the agreement'}
              </Button>
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
          {agentScheduled && (
            <div className="rounded-xl border bg-card p-4 text-sm">
              <p className="font-medium">Key collection arranged by your agent</p>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                Collect your keys at the date, time, and location below. Upload a photo when you
                have the keys.
              </p>
              <div className="mt-4 space-y-3">
                {scheduleWindow && (
                  <div className="flex items-start gap-3">
                    <Calendar className="text-primary mt-0.5 size-4 shrink-0" />
                    <div>
                      <p className="text-muted-foreground text-xs font-medium uppercase">Date & time</p>
                      <p className="mt-0.5 font-medium">{scheduleWindow}</p>
                    </div>
                  </div>
                )}
                {scheduledLocation && (
                  <div className="flex items-start gap-3">
                    <MapPin className="text-primary mt-0.5 size-4 shrink-0" />
                    <div>
                      <p className="text-muted-foreground text-xs font-medium uppercase">Location</p>
                      <p className="mt-0.5 font-medium">{scheduledLocation}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!agentScheduled && (
            <p className="text-muted-foreground text-sm">
              Your agent has not sent key collection details yet. Enter when and where you will pick
              up the keys, or check back once they have scheduled it.
            </p>
          )}

          {tenantProofSubmitted && scheduledTime && (
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

          <div className="space-y-2">
            <Label>Key collection photo</Label>
            <p className="text-muted-foreground text-xs">
              {agentScheduled
                ? 'Snap or upload a photo of the keys as proof that you collected them.'
                : 'Snap or upload a photo of the keys as proof for your key collection report.'}
            </p>
            <FileUploadField
              accept="image/*"
              capture="environment"
              label="Snap or upload key photo"
              hint="Use your camera or choose from your gallery"
              footer="Image · max 10 MB recommended"
              onFileSelect={setKeyPhoto}
            />
          </div>

          {!agentScheduled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="keyLocation">Pickup location</Label>
                <Input
                  id="keyLocation"
                  required
                  placeholder={
                    leasingOnboarding?.keyCustody === 'crossub'
                      ? 'CROSSUB office address'
                      : 'Agent office or property address'
                  }
                  value={keyLocation}
                  onChange={(e) => setKeyLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keyTime">Pickup date & time</Label>
                <Input
                  id="keyTime"
                  type="datetime-local"
                  required
                  value={keyTime}
                  onChange={(e) => setKeyTime(e.target.value)}
                />
              </div>
            </>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || (!agentScheduled && (!keyTime || !keyLocation.trim()))}
          >
            {submitting
              ? 'Saving…'
              : tenantProofSubmitted
                ? 'Update key collection report'
                : 'Submit key collection report'}
          </Button>
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

      {step.id === 'ingoing_report' && (
        <Button asChild className="w-full">
          <a href={step.href}>Open ingoing report confirmation</a>
        </Button>
      )}
    </TenantShell>
  );
}
