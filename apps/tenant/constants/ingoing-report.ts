import type { IngoingReportStatus } from '@/lib/types';

/**
 * Ingoing-report states that still want something from the tenant.
 *
 * A card in one of these states must open the acknowledgement screen
 * (`/inspections/ingoing/:id`), where the tenant confirms or disputes each
 * section and then approves or rejects the whole report. Once the report is
 * settled the card is just a record, so it opens the PDF instead.
 */
export const INGOING_REPORT_AWAITING_TENANT_STATUSES: readonly IngoingReportStatus[] =
  ['pending_tenant_review', 'partially_confirmed', 'disputed', 'overdue'];

export function isIngoingReportAwaitingTenant(
  status: IngoingReportStatus,
): boolean {
  return INGOING_REPORT_AWAITING_TENANT_STATUSES.includes(status);
}
