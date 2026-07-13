import type { IngoingReport } from '@/lib/types';

/** Whether the tenant still needs to confirm the ingoing report. */
export function needsIngoingConfirmationAction(report: IngoingReport): boolean {
  return report.status !== 'confirmed';
}

/** First agent-scheduled ingoing inspection awaiting tenant action. */
export function findUrgentIngoingInspection(
  reports: IngoingReport[],
): IngoingReport | undefined {
  return reports.find(needsIngoingConfirmationAction) ?? reports[0];
}
