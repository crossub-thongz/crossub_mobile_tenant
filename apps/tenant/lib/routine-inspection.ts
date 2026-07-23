import type { TenantRoutineInspection } from '@/lib/crossub-api/tenant-account-client';

/** Whether the tenant still needs to act on a routine inspection. */
export function needsRoutineInspectionAction(
  inspection: TenantRoutineInspection,
): boolean {
  return inspection.tenantActionRequired;
}

/** Poll while the routine may change without tenant action (review, decline, approval). */
export function shouldLivePollRoutineInspection(
  inspection: TenantRoutineInspection | null | undefined,
): boolean {
  if (!inspection) return false;
  if (inspection.flow !== 'self') {
    return inspection.status !== 'completed';
  }
  return (
    inspection.status === 'under_review' ||
    inspection.status === 'awaiting_tenant' ||
    inspection.status === 'in_progress' ||
    inspection.tenantActionRequired ||
    Boolean(inspection.declineReason)
  );
}

/** First agent-created routine inspection requiring tenant action. */
export function findUrgentRoutineInspection(
  inspections: TenantRoutineInspection[],
): TenantRoutineInspection | undefined {
  return inspections.find(needsRoutineInspectionAction) ?? inspections[0];
}

/** Friendly status label for routine inspection cards. */
export function routineInspectionStatusLabel(
  status: TenantRoutineInspection['status'],
): string {
  switch (status) {
    case 'awaiting_tenant':
      return 'Action required';
    case 'in_progress':
      return 'In progress';
    case 'under_review':
      return 'Under review';
    case 'completed':
      return 'Completed';
    default:
      return 'Scheduled';
  }
}
