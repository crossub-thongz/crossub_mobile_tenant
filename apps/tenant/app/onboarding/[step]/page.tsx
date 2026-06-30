'use client';

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
import { submitKeyCollection, uploadKeyCollectionPhotos } from '@/lib/crossub-api/tenant-leasing-client';
import { PAYMENT_STEP_COPY } from '@/lib/onboarding-payment-copy';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

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
  const keyDone = leasingOnboarding?.keyCollection.status === 'done';

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
  const paymentCopy =
    step.id === 'deposit' || step.id === 'bond'
      ? PAYMENT_STEP_COPY[step.id]
      : null;

  const handleKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyTime || !keyLocation.trim()) {
      toast.error('Enter both pickup time and location');
      return;
    }

    const existingPhotos = leasingOnboarding?.keyCollection.photos ?? [];
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
        time: new Date(keyTime).toISOString(),
        location: keyLocation.trim(),
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

          <FileUploadField accept="image/*,.pdf" onFileSelect={setFile} />

          <Button
            className="w-full"
            disabled={!file}
            onClick={() =>
              toast.success('Proof uploaded — pending CROSSUB approval', {
                description: file?.name,
              })
            }
          >
            Submit proof
          </Button>
        </div>
      )}

      {isLease && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-4 text-sm">
            <p className="font-medium">Lease agreement (preview)</p>
            <p className="text-muted-foreground mt-2 text-xs">
              E-sign integration can be added later. MVP: acknowledge and download copy.
            </p>
          </div>
          <Button className="w-full" onClick={() => toast.success('Lease marked as signed')}>
            Sign agreement
          </Button>
        </div>
      )}

      {isKeyPickup && (
        <form className="space-y-4" onSubmit={handleKeySubmit}>
          {keyDone && leasingOnboarding?.keyCollection.time && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
              <p className="font-medium">Key collection confirmed</p>
              <p className="text-muted-foreground mt-1">
                {formatDateTime(leasingOnboarding.keyCollection.time)}
                {leasingOnboarding.keyCollection.location
                  ? ` · ${leasingOnboarding.keyCollection.location}`
                  : ''}
              </p>
            </div>
          )}

          {leasingOnboarding?.keyCollection.photos &&
            leasingOnboarding.keyCollection.photos.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Key collection proof</p>
                <div className="flex flex-wrap gap-2">
                  {leasingOnboarding.keyCollection.photos.map((url) => (
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
              Snap or upload a photo of the keys as proof for your key collection report.
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
            <Label htmlFor="keyTime">Preferred pickup time</Label>
            <Input
              id="keyTime"
              type="datetime-local"
              required
              value={keyTime}
              onChange={(e) => setKeyTime(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting
              ? 'Saving…'
              : keyDone
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
