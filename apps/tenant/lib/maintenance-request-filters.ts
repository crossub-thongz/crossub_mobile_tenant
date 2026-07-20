import type { MaintenanceRequest } from '@/lib/types';

/** In-flight repairs the tenant should track (excludes completed/closed/cancelled). */
export function isActiveMaintenanceRequest(request: MaintenanceRequest): boolean {
  if (request.status === 'completed' || request.status === 'closed') return false;
  if (request.tenantCompletionApproved) return false;
  return true;
}

export function isHistoryMaintenanceRequest(request: MaintenanceRequest): boolean {
  return !isActiveMaintenanceRequest(request);
}
