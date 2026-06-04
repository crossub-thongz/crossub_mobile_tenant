'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/lib/utils';

export default function TerminationPage() {
  const { terminationNotice, recordVacatingDate } = useTenantData();
  const [moveOut, setMoveOut] = useState('');

  if (!terminationNotice) {
    return (
      <TenantShell title="Termination" backHref={ROUTES.DASHBOARD}>
        <p className="text-muted-foreground text-sm">
          No termination notice on your account. If CROSSUB needs to end your lease, you will
          receive a notification here.
        </p>
      </TenantShell>
    );
  }

  return (
    <TenantShell title="Termination notice" backHref={ROUTES.DASHBOARD}>
      <div className="space-y-4">
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <p className="font-semibold">{terminationNotice.propertyAddress}</p>
          <p className="mt-2">{terminationNotice.reason}</p>
          <p className="text-muted-foreground mt-2 text-xs">
            Please respond by {formatDate(terminationNotice.respondBy)}
          </p>
          {terminationNotice.vacateDeadline && (
            <p className="mt-1 text-xs">Vacate deadline: {formatDate(terminationNotice.vacateDeadline)}</p>
          )}
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href={ROUTES.MESSAGES_NEW}>Message CROSSUB</Link>
        </Button>
        <div className="rounded-xl border p-4">
          <p className="text-sm font-medium">Select move-out date</p>
          <Input
            type="date"
            className="mt-2"
            value={moveOut}
            onChange={(e) => setMoveOut(e.target.value)}
          />
          <Button
            className="mt-3 w-full"
            onClick={() => {
              if (!moveOut) return toast.error('Select a date');
              recordVacatingDate(moveOut);
              toast.success('Move-out date recorded');
              window.location.href = ROUTES.MOVE_OUT_SERVICES;
            }}
          >
            Confirm vacating date
          </Button>
        </div>
      </div>
    </TenantShell>
  );
}
