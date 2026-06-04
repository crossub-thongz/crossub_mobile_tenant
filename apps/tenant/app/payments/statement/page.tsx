'use client';

import Link from 'next/link';

import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function StatementPage() {
  const { finalStatement } = useTenantData();

  if (!finalStatement) {
    return (
      <TenantShell title="Final statement" backHref={ROUTES.PAYMENTS}>
        <p className="text-muted-foreground text-sm">
          Your final bond statement will appear here after vacating and outgoing inspection are
          finalized. Calculations confirmed with Accounting/Tony.
        </p>
      </TenantShell>
    );
  }

  const rows = [
    { label: 'Total bond', value: finalStatement.totalBond },
    { label: 'Rent arrears', value: -finalStatement.rentArrears },
    { label: 'Unpaid bills', value: -finalStatement.unpaidBills },
    { label: 'Repair / cleaning deductions', value: -finalStatement.deductions },
  ];

  return (
    <TenantShell title="Final statement" backHref={ROUTES.PAYMENTS}>
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">{finalStatement.propertyAddress}</p>
        <p className="text-xs text-muted-foreground">
          Finalized {formatDate(finalStatement.finalizedAt)}
        </p>
        <div className="rounded-xl border bg-card divide-y text-sm">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex justify-between px-4 py-3">
              <span className="text-muted-foreground">{label}</span>
              <span className={value < 0 ? 'text-destructive' : ''}>
                {value < 0 ? '−' : ''}
                {formatCurrency(Math.abs(value))}
              </span>
            </div>
          ))}
          <div className="flex justify-between px-4 py-3 font-semibold">
            <span>Final refund / owing</span>
            <span className="text-primary">
              {finalStatement.finalRefund >= 0 ? '' : '−'}
              {formatCurrency(Math.abs(finalStatement.finalRefund))}
            </span>
          </div>
        </div>
        {finalStatement.pdfAvailable && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => alert('Statement PDF — accounting integration')}
          >
            Download statement PDF
          </Button>
        )}
        <Link href={ROUTES.MESSAGES} className="text-primary block text-center text-sm font-medium">
          Questions or disputes? Message CROSSUB →
        </Link>
      </div>
    </TenantShell>
  );
}
