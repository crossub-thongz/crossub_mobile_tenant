/**
 * Tenant response to a contractor's proposed visit times.
 *
 * These are the wire values accepted by `POST /tenant/maintenance-requests/{id}/schedule-response`
 * (`TenantScheduleResponseDto.decision` on the API). Compare against these constants rather
 * than raw strings.
 */
export const SCHEDULE_DECISION = {
  APPROVED: 'approved',
  DECLINED: 'declined',
} as const;

export type ScheduleDecision =
  (typeof SCHEDULE_DECISION)[keyof typeof SCHEDULE_DECISION];
