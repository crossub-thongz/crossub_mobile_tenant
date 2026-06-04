'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

const STEPS = [
  { title: 'Home', body: 'Summary cards for Property, Inspection, Repair, Accounting, and Messages.' },
  { title: 'Property', body: 'Your lease address, rent, and key dates.' },
  { title: 'Repair', body: 'Report issues, track progress, message CROSSUB or contractors, approve completion.' },
  { title: 'Rent review', body: 'When notified, approve, decline, or counter offer — or select move-out date.' },
  { title: 'New tenants', body: 'Apply from listings → onboarding → keys → ingoing confirmation = official move-in.' },
];

export default function TutorialPage() {
  const router = useRouter();

  const finish = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('crossub_tenant_tutorial_done', '1');
    }
    router.push(ROUTES.DASHBOARD);
  };

  return (
    <TenantShell title="How to use the app">
      <p className="text-muted-foreground mb-4 text-sm">
        Required tutorial for every new registration.
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
        Got it — go to Home
      </Button>
      <Link
        href={ROUTES.PROPERTIES}
        className="text-primary mt-4 block text-center text-xs font-medium"
      >
        I&apos;m looking for a property to rent
      </Link>
    </TenantShell>
  );
}
