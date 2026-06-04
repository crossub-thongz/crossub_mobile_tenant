'use client';

import Link from 'next/link';

import { TenantShell } from '@/components/layout/tenant-shell';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { outgoingReport, ROUTES, statementDetail } from '@/constants/routes';
import { hrefWithFrom } from '@/lib/back-navigation';
import { OUTGOING_STATUS_LABEL } from '@/lib/tenant-labels';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function VacatingPage() {
  const { vacating, finalStatement, showPhase3Demo, outgoingReport: outgoing } =
    useTenantData();

  if (!vacating) {
    return (
      <TenantShell title="Vacating">
        <p className="text-muted-foreground text-sm">
          No active vacating process. If you choose not to renew or rent review is not agreed,
          select your move-out date from{' '}
          <Link href={ROUTES.RENEWAL} className="text-primary font-medium">
            Lease renewal
          </Link>
          .
        </p>
        {showPhase3Demo && (
          <p className="text-muted-foreground mt-4 text-xs">
            Set SHOW_PHASE3_DEMO in mock-data to preview vacating + final statement flows.
          </p>
        )}
        <Link
          href={hrefWithFrom(outgoingReport(outgoing.id), 'vacating')}
          className="text-primary mt-6 block text-sm font-medium"
        >
          Preview outgoing report flow (demo) →
        </Link>
      </TenantShell>
    );
  }

  return (
    <TenantShell title="Vacating">
      <div className="space-y-5">
        <div className="rounded-xl border bg-card p-4 text-sm">
          <p className="font-semibold">{vacating.propertyAddress}</p>
          <p className="text-muted-foreground mt-1">
            Vacating {formatDate(vacating.vacatingDate)}
          </p>
          <p className="mt-2 text-xs">
            {OUTGOING_STATUS_LABEL[vacating.outgoingStatus]}
          </p>
          {vacating.outgoingReportId && (
            <Link
              href={hrefWithFrom(outgoingReport(vacating.outgoingReportId), 'vacating')}
              className="text-primary mt-3 inline-block text-xs font-medium"
            >
              Review outgoing report →
            </Link>
          )}
        </div>
        {finalStatement && (
          <section className="rounded-xl border bg-card p-4">
            <h2 className="text-sm font-semibold">Final statement</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Bond position after reconciliation — confirm with Accounting.
            </p>
            <p className="mt-2 text-lg font-semibold text-primary">
              {finalStatement.finalRefund >= 0 ? 'Refund' : 'Owing'}:{' '}
              {formatCurrency(Math.abs(finalStatement.finalRefund))}
            </p>
            <Link
              href={statementDetail()}
              className="text-primary mt-2 inline-block text-xs font-medium"
            >
              Full breakdown →
            </Link>
          </section>
        )}
      </div>
    </TenantShell>
  );
}
