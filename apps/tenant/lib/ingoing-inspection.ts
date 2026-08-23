import type { IngoingReport } from '@/lib/types';

/** Whether the tenant still needs to confirm the ingoing report. */
export function needsIngoingConfirmationAction(report: IngoingReport): boolean {
  return (
    report.released === true &&
    report.status !== 'confirmed' &&
    report.status !== 'rejected' &&
    report.status !== 'awaiting_admin' &&
    report.status !== 'overdue'
  );
}

/** First agent-scheduled ingoing inspection awaiting tenant action. */
export function findUrgentIngoingInspection(
  reports: IngoingReport[],
): IngoingReport | undefined {
  return reports.find(needsIngoingConfirmationAction) ?? reports[0];
}
