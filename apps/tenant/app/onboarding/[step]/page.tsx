'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { FileUploadField } from '@/components/tenant/file-upload-field';
import { Button } from '@/components/ui/button';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';
import { PAYMENT_STEP_COPY } from '@/lib/onboarding-payment-copy';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function OnboardingStepPage() {
  const { step: stepId } = useParams<{ step: string }>();
  const { onboardingSteps } = useTenantData();
  const step = onboardingSteps.find((s) => s.id === stepId);
  const [file, setFile] = useState<File | null>(null);

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

  return (
    <TenantShell title={step.title} backHref={ROUTES.ONBOARDING}>
      {paymentCopy && (
        <p className="text-muted-foreground mb-4 text-sm leading-relaxed">{paymentCopy.summary}</p>
      )}
      {!paymentCopy && (
        <p className="text-muted-foreground mb-4 text-sm">{step.description}</p>
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

      {step.id === 'account_setup' && (
        <p className="text-sm text-muted-foreground">
          Profile linked to lease record when you sign in with your tenant account.
        </p>
      )}

      {step.id === 'ingoing_report' && (
        <Button asChild className="w-full">
          <a href={step.href}>Open ingoing report confirmation</a>
        </Button>
      )}
    </TenantShell>
  );
}
