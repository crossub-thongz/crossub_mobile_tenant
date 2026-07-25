export type RentPaymentCycle = 'weekly' | 'fortnightly' | 'monthly';

export function normalizePaymentCycle(raw?: string | null): RentPaymentCycle {
  const value = raw?.trim().toLowerCase();
  if (value === 'fortnightly' || value === 'monthly') return value;
  return 'weekly';
}

/** Convert stored weekly rent into the tenant's payment-cycle amount. */
export function amountFromWeeklyRent(
  weekly: number,
  cycle: RentPaymentCycle,
): number {
  if (!weekly || weekly <= 0) return 0;
  if (cycle === 'weekly') return Math.round(weekly * 100) / 100;
  if (cycle === 'fortnightly') return Math.round(weekly * 2 * 100) / 100;
  return Math.round(((weekly * 52) / 12) * 100) / 100;
}

export function paymentCycleUnitLabel(cycle: RentPaymentCycle): string {
  switch (cycle) {
    case 'fortnightly':
      return 'fortnight';
    case 'monthly':
      return 'month';
    default:
      return 'week';
  }
}

export function paymentCycleTitle(cycle: RentPaymentCycle): string {
  switch (cycle) {
    case 'fortnightly':
      return 'Fortnightly';
    case 'monthly':
      return 'Monthly';
    default:
      return 'Weekly';
  }
}

export function resolveLeaseRentCycle(lease: {
  paymentCycle?: string | null;
  leaseTerm?: string;
} | null): RentPaymentCycle {
  if (lease?.paymentCycle) return normalizePaymentCycle(lease.paymentCycle);
  const term = lease?.leaseTerm?.toLowerCase() ?? '';
  if (term.includes('fortnight')) return 'fortnightly';
  if (term.includes('month')) return 'monthly';
  return 'weekly';
}

export function resolveCycleRentAmount(lease: {
  rentWeekly: number;
  paymentCycle?: string | null;
  leaseTerm?: string;
} | null): number | null {
  if (!lease || lease.rentWeekly <= 0) return null;
  const cycle = resolveLeaseRentCycle(lease);
  return amountFromWeeklyRent(lease.rentWeekly, cycle);
}
