'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/lib/utils';

export default function OnboardingStepPage() {
  const { step: stepId } = useParams<{ step: string }>();
  const { onboardingSteps } = useTenantData();
  const step = onboardingSteps.find((s) => s.id === stepId);
  const [uploaded, setUploaded] = useState(false);

  if (!step) {
    return (
      <TenantShell title="Onboarding" backHref={ROUTES.ONBOARDING}>
        <p className="text-sm text-muted-foreground">Step not found.</p>
      </TenantShell>
    );
  }

  const isUpload = step.id === 'deposit' || step.id === 'bond';
  const isLease = step.id === 'lease_signing';

  return (
    <TenantShell title={step.title} backHref={ROUTES.ONBOARDING}>
      <p className="text-muted-foreground mb-4 text-sm">{step.description}</p>
      {step.amount != null && (
        <p className="mb-4 text-lg font-semibold text-primary">{formatCurrency(step.amount)}</p>
      )}
      {isUpload && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Payment instructions — confirm wording with Leasing/Fay (RBO/process per jurisdiction).
          </p>
          <Input type="file" accept="image/*,.pdf" onChange={() => setUploaded(true)} />
          <Button
            className="w-full"
            disabled={!uploaded}
            onClick={() => toast.success('Proof uploaded — pending CROSSUB approval')}
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
