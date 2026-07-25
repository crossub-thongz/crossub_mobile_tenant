'use client';

import type { LeaseSummary } from '@/lib/types';
import {
  paymentCycleTitle,
  paymentCycleUnitLabel,
  resolveCycleRentAmount,
  resolveLeaseRentCycle,
} from '@/lib/rent-calculations';
import { formatCurrency } from '@/lib/utils';

export function RentCycleAmount({
  lease,
  className,
}: {
  lease: LeaseSummary;
  className?: string;
}) {
  const cycle = resolveLeaseRentCycle(lease);
  const amount = resolveCycleRentAmount(lease);
  if (amount == null) return null;

  return (
    <p className={className}>
      {formatCurrency(amount)}
      <span className="text-muted-foreground text-base font-normal">
        /{paymentCycleUnitLabel(cycle)}
      </span>
    </p>
  );
}

export function RentCycleSummary({ lease }: { lease: LeaseSummary }) {
  const cycle = resolveLeaseRentCycle(lease);
  const amount = resolveCycleRentAmount(lease);
  if (amount == null) return null;

  return (
    <p className="text-muted-foreground mt-1 text-xs">
      {paymentCycleTitle(cycle)} rent · {formatCurrency(lease.rentWeekly)}/week equivalent
    </p>
  );
}
