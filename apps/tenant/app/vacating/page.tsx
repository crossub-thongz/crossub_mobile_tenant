'use client';

import Link from 'next/link';

import { TenantShell } from '@/components/layout/tenant-shell';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { outgoingReport, ROUTES } from '@/constants/routes';
import { formatDate } from '@/lib/utils';

export default function VacatingPage() {
  const { vacating, finalStatement } = useTenantData();

  if (!vacating) {
    return (
      <TenantShell title="Vacating">
        <p className="text-muted-foreground text-sm">
          No active vacating process. If you choose not to renew or rent review fails, select your
          move-out date from Lease renewal.
        </p>
      </TenantShell>
    );
  }

  return (
    <TenantShell title="Vacating">
      <div className="rounded-xl border bg-card p-4 text-sm">
        <p className="font-semibold">{vacating.propertyAddress}</p>
        <p className="text-muted-foreground mt-1">
          Vacating {formatDate(vacating.vacatingDate)}
        </p>
        <p className="mt-2 capitalize">
          Outgoing: {vacating.outgoingStatus.replace(/_/g, ' ')}
        </p>
        {vacating.outgoingReportId && (
          <Link
            href={outgoingReport(vacating.outgoingReportId)}
            className="text-primary mt-3 inline-block text-xs font-medium"
          >
            Review outgoing report →
          </Link>
        )}
      </div>
      {finalStatement && (
        <section className="mt-6 rounded-xl border bg-card p-4">
          <h2 className="text-sm font-semibold">Final statement</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Bond refund position — confirm calculations with Accounting/Tony.
          </p>
          <p className="mt-2 text-lg font-semibold">
            {finalStatement.finalRefund >= 0 ? 'Refund' : 'Amount owing'}: $
            {Math.abs(finalStatement.finalRefund).toLocaleString()}
          </p>
        </section>
      )}
    </TenantShell>
  );
}
