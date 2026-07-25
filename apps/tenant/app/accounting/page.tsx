'use client';

import { useState } from 'react';
import { Wallet } from 'lucide-react';

import { AccountingHistorySection } from '@/components/tenant/accounting-history-section';
import { ArrearsBanner } from '@/components/tenant/arrears-banner';
import { PayRentCard } from '@/components/tenant/pay-rent-card';
import { RentCycleAmount, RentCycleSummary } from '@/components/tenant/rent-cycle-amount';
import { TenantShell } from '@/components/layout/tenant-shell';
import { InfoCard } from '@/components/tenant/info-card';
import { PageIntro } from '@/components/tenant/page-intro';
import { UpcomingRentHint } from '@/components/tenant/upcoming-rent-hint';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { resolveUpcomingRentHint } from '@/lib/rent-review';
import { paymentCycleTitle, resolveLeaseRentCycle } from '@/lib/rent-calculations';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

type AccountingTab = 'overview' | 'history';

export default function AccountingPage() {
  const [tab, setTab] = useState<AccountingTab>('overview');
  const {
    rentReceipts,
    lease,
    paymentProofs,
    outstandingBalance,
    finalStatement,
    storedDocuments,
    rentReviews,
    vacatingCase,
  } = useTenantData();

  const upcomingRentHint = resolveUpcomingRentHint(rentReviews, lease, vacatingCase);
  const paymentCycle = lease ? paymentCycleTitle(resolveLeaseRentCycle(lease)) : null;

  return (
    <TenantShell title="Accounting">
      <PageIntro description="Pay rent, see your current rate, and review receipts in History." />

      <div className="space-y-6">
        <div className="bg-muted/40 grid grid-cols-2 gap-1 rounded-xl p-1">
          {(
            [
              { id: 'overview' as const, label: 'Overview' },
              { id: 'history' as const, label: 'History' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                tab === item.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'overview' ? (
          <>
            <ArrearsBanner />
            <PayRentCard />

            {lease && (
              <InfoCard icon={Wallet} label="Current rent" accent="primary">
                <RentCycleAmount
                  lease={lease}
                  className="text-primary text-2xl font-bold tracking-tight"
                />
                <RentCycleSummary lease={lease} />
                {lease.rentPaidTo ? (
                  <p className="text-muted-foreground mt-3 text-sm">
                    Paid to{' '}
                    <span className="text-foreground font-medium">
                      {formatDate(lease.rentPaidTo)}
                    </span>
                  </p>
                ) : null}
                <UpcomingRentHint hint={upcomingRentHint} />
              </InfoCard>
            )}

            {outstandingBalance && (
              <InfoCard accent="danger" label="Outstanding balance">
                <p className="text-xl font-bold">{formatCurrency(outstandingBalance.amount)}</p>
                <p className="text-muted-foreground mt-1 text-sm">{outstandingBalance.reason}</p>
              </InfoCard>
            )}

            {paymentCycle ? (
              <p className="text-muted-foreground text-xs leading-relaxed">
                Your rent is charged on a {paymentCycle.toLowerCase()} cycle. Use History to
                download past receipts.
              </p>
            ) : null}
          </>
        ) : (
          <AccountingHistorySection
            rentReceipts={rentReceipts}
            paymentProofs={paymentProofs}
            finalStatement={finalStatement}
            storedDocuments={storedDocuments}
          />
        )}
      </div>
    </TenantShell>
  );
}
