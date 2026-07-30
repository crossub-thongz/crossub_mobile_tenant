import { LOCAL_MAINTENANCE_REQUEST_ID_PREFIX } from '@/constants/maintenance-request-list';
import type { MaintenanceRequest } from '@/lib/types';

/** In-flight repairs the tenant should track (excludes completed/closed/cancelled). */
export function isActiveMaintenanceRequest(request: MaintenanceRequest): boolean {
  return request.status !== 'completed' && request.status !== 'closed';
}

export function isHistoryMaintenanceRequest(request: MaintenanceRequest): boolean {
  return !isActiveMaintenanceRequest(request);
}

/** True when the id was minted in the browser and the API has not confirmed the job yet. */
export function isLocalMaintenanceRequest(request: MaintenanceRequest): boolean {
  return request.id.startsWith(LOCAL_MAINTENANCE_REQUEST_ID_PREFIX);
}

/**
 * Newest first, by the same `createdAt` the cards print. Rows with no usable date sort
 * last rather than to the top, where a missing value would read as a brand-new repair.
 */
export function sortMaintenanceRequestsNewestFirst(
  requests: MaintenanceRequest[],
): MaintenanceRequest[] {
  return [...requests].sort((a, b) => {
    const left = Date.parse(a.createdAt ?? '');
    const right = Date.parse(b.createdAt ?? '');
    if (Number.isNaN(left)) return Number.isNaN(right) ? 0 : 1;
    if (Number.isNaN(right)) return -1;
    return right - left;
  });
}

/**
 * Fold the API list together with what the app already had. The API list is the truth:
 * a row it does not contain survives only while its id is still a local one, so a repair
 * that was deleted (or that the tenant can no longer see) leaves the list instead of
 * lingering as a snapshot that can never update again.
 *
 * The result is always sorted, because merge order is not display order — the previous
 * version concatenated the leftovers in front, which pinned old repairs above a job the
 * tenant filed minutes ago.
 */
export function mergeMaintenanceRequests(
  fromApi: MaintenanceRequest[],
  previous: MaintenanceRequest[],
): MaintenanceRequest[] {
  const confirmed = new Set(fromApi.map((request) => request.id));
  const unconfirmed = previous.filter(
    (request) => isLocalMaintenanceRequest(request) && !confirmed.has(request.id),
  );
  return sortMaintenanceRequestsNewestFirst([...unconfirmed, ...fromApi]);
}
