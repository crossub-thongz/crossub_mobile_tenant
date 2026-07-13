'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ROUTES, onboardingStep } from '@/constants/routes';
import { useTenantData } from '@/components/providers/tenant-data-provider';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Not started',
  uploaded: 'In progress',
  approved: 'Submitted',
  completed: 'Done',
};

export function OnboardingPendingAlert() {
  const { onboardingSteps, leasingOnboarding } = useTenantData();
  const pending = onboardingSteps.filter((s) => s.status !== 'completed');

  if (!leasingOnboarding || pending.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-300" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
            Action required — complete your move-in checklist
          </p>
          <p className="mt-1 text-xs leading-relaxed text-amber-900/90 dark:text-amber-100/90">
            Your agent and CROSSUB are waiting on the items below from onboarding procedures.
            Submit proofs and confirmations as each step becomes available.
          </p>
          <ul className="mt-3 space-y-1.5 text-xs">
            {pending.map((step) => (
              <li key={step.id} className="flex items-center justify-between gap-2">
                <span className="font-medium">{step.title}</span>
                <span className="text-muted-foreground shrink-0">
                  {STATUS_LABEL[step.status] ?? step.status}
                </span>
              </li>
            ))}
          </ul>
          <Button asChild size="sm" className="mt-4 h-8 w-full text-xs">
            <Link href={ROUTES.ONBOARDING}>Go to onboarding checklist</Link>
          </Button>
          {pending[0] ? (
            <Button asChild size="sm" variant="outline" className="mt-2 h-8 w-full text-xs">
              <Link href={pending[0].href ?? onboardingStep(pending[0].id)}>
                Start: {pending[0].title}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
