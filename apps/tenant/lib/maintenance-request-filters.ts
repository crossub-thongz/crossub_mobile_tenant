import type { MaintenanceRequest } from '@/lib/types';

/** In-flight repairs the tenant should track (excludes completed/closed/cancelled). */
export function isActiveMaintenanceRequest(request: MaintenanceRequest): boolean {
  return request.status !== 'completed' && request.status !== 'closed';
}

export function isHistoryMaintenanceRequest(request: MaintenanceRequest): boolean {
  return !isActiveMaintenanceRequest(request);
}
