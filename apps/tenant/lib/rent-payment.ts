import type { ArrearsNotice, LeaseSummary, OutstandingBalance } from '@/lib/types';
import {
  amountFromWeeklyRent,
  paymentCycleUnitLabel,
  resolveLeaseRentCycle,
} from '@/lib/rent-calculations';

/** Amount the tenant should pay next (outstanding → arrears → one payment cycle). */
export function computeRentAmountDue(
  lease: LeaseSummary | null,
  arrears: ArrearsNotice | null,
  outstanding: OutstandingBalance | null,
): number | null {
  if (outstanding) return outstanding.amount;
  if (arrears && arrears.stage !== 'resolved') return arrears.outstandingAmount;
  if (lease) {
    const cycle = resolveLeaseRentCycle(lease);
    return amountFromWeeklyRent(lease.rentWeekly, cycle);
  }
  return null;
}

export function rentPaymentCycleHint(lease: LeaseSummary | null): string {
  if (!lease) return 'Suggested payment at current rate';
  const cycle = resolveLeaseRentCycle(lease);
  return `Suggested payment — one ${paymentCycleUnitLabel(cycle)} at current rate`;
}

/** Bank transfer fields — left empty until real agency trust details are wired. */
export const DEMO_BANK_DETAILS = {
  accountName: '',
  bsb: '',
  accountNumber: '',
  payId: '',
} as const;

export function rentPaymentReference(leaseId: string | null, userId: string | null): string {
  const suffix = (leaseId ?? userId ?? 'TENANT').replace(/[^a-zA-Z0-9]/g, '').slice(-8);
  return `RENT-${suffix.toUpperCase()}`;
}
