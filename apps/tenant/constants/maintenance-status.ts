/**
 * Runtime values for the tenant-facing maintenance status (`MaintenanceTenantStatus` in
 * `lib/types.ts`). Derived by `lib/tenant-maintenance-status.ts` from the API's
 * `MaintenanceStatus` plus workflow flags — it is not a Prisma enum, so it lives here
 * rather than in `constants/api-enums.ts`.
 */
export const MAINTENANCE_TENANT_STATUS = {
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  WAITING_FOR_APPROVAL: 'waiting_for_approval',
  CONTRACTOR_ASSIGNED: 'contractor_assigned',
  APPOINTMENT_REQUIRED: 'appointment_required',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CLOSED: 'closed',
} as const;

/** Terminal states — no tenant action remains on the job. */
export const MAINTENANCE_TENANT_FINISHED_STATUSES = [
  MAINTENANCE_TENANT_STATUS.COMPLETED,
  MAINTENANCE_TENANT_STATUS.CLOSED,
] as const;
