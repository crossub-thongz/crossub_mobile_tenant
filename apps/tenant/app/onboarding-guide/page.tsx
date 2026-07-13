'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/components/providers/auth-provider';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { markOnboardingGuideDone } from '@/lib/tenant-post-auth';

const STEPS = [
  {
    title: 'Your property',
    body: 'After approval, your leased property appears on the Property tab with rent and key dates.',
  },
  {
    title: 'Onboarding checklist',
    body: 'Complete deposit, bond, lease signing, and key collection steps coordinated with your agent and CROSSUB.',
  },
  {
    title: 'Upload proofs',
    body: 'Submit deposit and bond receipts when requested. Confirm key collection with photos.',
  },
  {
    title: 'Move-in inspection',
    body: 'Review and confirm the ingoing condition report before your tenancy is finalised.',
  },
  {
    title: 'Day-to-day tenancy',
    body: 'Use Repairs, Accounting, and Messages once you are officially moved in.',
  },
];

export default function OnboardingGuidePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { leasingOnboarding } = useTenantData();

  const finish = () => {
    if (user) markOnboardingGuideDone(user.id);
    router.push(ROUTES.PROPERTY);
  };

  return (
    <TenantShell title="Welcome to your tenancy">
      <p className="text-muted-foreground mb-4 text-sm">
        {leasingOnboarding
          ? `You have been approved for ${leasingOnboarding.propertyAddress}. Complete the steps below to move in.`
          : 'Here is how to complete your move-in and manage your tenancy in CROSSUB.'}
      </p>
      <ol className="space-y-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="rounded-xl border bg-card p-4 text-sm">
            <p className="font-semibold">
              {i + 1}. {s.title}
            </p>
            <p className="text-muted-foreground mt-1">{s.body}</p>
          </li>
        ))}
      </ol>
      <Button className="mt-6 w-full" onClick={finish}>
        I understand — view my property
      </Button>
      <Link
        href={ROUTES.ONBOARDING}
        className="text-primary mt-4 block text-center text-xs font-medium"
      >
        Open onboarding checklist
      </Link>
    </TenantShell>
  );
}
