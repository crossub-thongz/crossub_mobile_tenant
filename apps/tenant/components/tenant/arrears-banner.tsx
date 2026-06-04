'use client';

import Link from 'next/link';

import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';
import { ARREARS_STAGE_LABEL } from '@/lib/tenant-labels';
import { formatCurrency, formatDate } from '@/lib/utils';

export function ArrearsBanner() {
  const { arrears } = useTenantData();
  if (!arrears || arrears.stage === 'resolved') return null;

  const urgent = arrears.stage === 'termination_notice';

  return (
    <div
      className={`rounded-xl border p-4 text-sm ${
        urgent
          ? 'border-destructive/50 bg-destructive/10'
          : 'border-amber-500/40 bg-amber-500/10'
      }`}
    >
      <p className="font-semibold">{ARREARS_STAGE_LABEL[arrears.stage]}</p>
      <p className="text-muted-foreground mt-1">{arrears.message}</p>
      <p className="mt-2">
        Outstanding: <strong>{formatCurrency(arrears.outstandingAmount)}</strong> · Due{' '}
        {formatDate(arrears.dueDate)}
      </p>
      <Link
        href={`${ROUTES.ACCOUNTING}#pay-rent`}
        className="text-primary mt-2 inline-block text-xs font-medium"
      >
        Pay rent now →
      </Link>
    </div>
  );
}
