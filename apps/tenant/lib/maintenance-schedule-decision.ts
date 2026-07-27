import { SCHEDULE_DECISION, type ScheduleDecision } from '@/constants/maintenance-schedule';

/**
 * Durable record of "this tenant already answered the visit-time proposal".
 *
 * The server flag (`scheduleApprovalPending`) is the source of truth, but it cannot be
 * relied on alone to close the approve/decline card:
 *
 * - `syncMaintenanceRequests` re-polls every `LIVE_POLL_MS` and *replaces* API-backed rows,
 *   discarding the optimistic `scheduleApprovalPending: false` the provider wrote — so the
 *   card re-opens within seconds if the API has not settled the decision yet.
 * - Component state resetting on reload (tenants routinely re-enter from the email link)
 *   would otherwise re-arm the buttons and let a second POST re-trigger the contractor email.
 *
 * Keyed by request id and stamped with the proposal round it answered, so a *new* set of
 * proposed times from the contractor correctly re-arms the card.
 */

const STORAGE_KEY = 'crossub:maintenance-schedule-decisions';

export interface StoredScheduleDecision {
  decision: ScheduleDecision;
  /** The proposed-times text this decision answered — identifies the proposal round. */
  proposedTimes: string;
  decidedAt: string;
}

type DecisionMap = Record<string, StoredScheduleDecision>;

function isDecision(value: unknown): value is ScheduleDecision {
  return value === SCHEDULE_DECISION.APPROVED || value === SCHEDULE_DECISION.DECLINED;
}

function readAll(): DecisionMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: DecisionMap = {};
    for (const [id, entry] of Object.entries(parsed as Record<string, unknown>)) {
      if (!entry || typeof entry !== 'object') continue;
      const { decision, proposedTimes, decidedAt } = entry as Record<string, unknown>;
      if (!isDecision(decision)) continue;
      out[id] = {
        decision,
        proposedTimes: typeof proposedTimes === 'string' ? proposedTimes : '',
        decidedAt: typeof decidedAt === 'string' ? decidedAt : '',
      };
    }
    return out;
  } catch {
    return {};
  }
}

function writeAll(map: DecisionMap): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Quota or private mode — the in-session guard still prevents a double submit.
  }
}

export function readScheduleDecision(requestId: string): StoredScheduleDecision | null {
  if (!requestId) return null;
  return readAll()[requestId] ?? null;
}

export function saveScheduleDecision(
  requestId: string,
  decision: ScheduleDecision,
  proposedTimes: string | null | undefined,
): void {
  if (!requestId) return;
  const map = readAll();
  map[requestId] = {
    decision,
    proposedTimes: proposedTimes?.trim() ?? '',
    decidedAt: new Date().toISOString(),
  };
  writeAll(map);
}

export function clearScheduleDecision(requestId: string): void {
  if (!requestId) return;
  const map = readAll();
  if (!(requestId in map)) return;
  delete map[requestId];
  writeAll(map);
}

/**
 * True when the contractor has proposed a *different* set of times since the stored
 * decision was made — the tenant must answer again.
 */
export function isNewProposalRound(
  stored: StoredScheduleDecision | null,
  proposedTimes: string | null | undefined,
): boolean {
  if (!stored) return false;
  const current = proposedTimes?.trim();
  if (!current) return false;
  return current !== stored.proposedTimes;
}
