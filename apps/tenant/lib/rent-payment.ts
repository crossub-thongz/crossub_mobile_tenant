import type { ArrearsNotice, LeaseSummary, OutstandingBalance } from '@/lib/types';

/** Amount the tenant should pay next (outstanding → arrears → ~4 weeks rent). */
export function computeRentAmountDue(
  lease: LeaseSummary | null,
  arrears: ArrearsNotice | null,
  outstanding: OutstandingBalance | null,
): number | null {
  if (outstanding) return outstanding.amount;
  if (arrears && arrears.stage !== 'resolved') return arrears.outstandingAmount;
  if (lease) return Math.round(lease.rentWeekly * 4 * 100) / 100;
  return null;
}

export const DEMO_BANK_DETAILS = {
  accountName: 'CROSSUB Trust Account',
  bsb: '062-000',
  accountNumber: '1234 5678',
  payId: 'rent@crossub.demo',
} as const;

export function rentPaymentReference(leaseId: string | null, userId: string | null): string {
  const suffix = (leaseId ?? userId ?? 'TENANT').replace(/[^a-zA-Z0-9]/g, '').slice(-8);
  return `RENT-${suffix.toUpperCase()}`;
}
