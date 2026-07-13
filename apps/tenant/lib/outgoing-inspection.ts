import type { OutgoingReport } from '@/lib/types';

/** Whether the tenant still needs to confirm the outgoing report. */
export function needsOutgoingConfirmationAction(report: OutgoingReport): boolean {
  return report.status !== 'confirmed' && report.status !== 'finalized';
}

/** First agent-scheduled outgoing inspection awaiting tenant action. */
export function findUrgentOutgoingInspection(
  reports: OutgoingReport[],
): OutgoingReport | undefined {
  return reports.find(needsOutgoingConfirmationAction) ?? reports[0];
}
