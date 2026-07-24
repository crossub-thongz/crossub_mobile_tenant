const STORAGE_PREFIX = 'crossub:open-inspection-check-in';

export interface StoredOpenInspectionCheckIn {
  propertyId: string;
  sessionId: string;
  attendeeId?: string;
  name: string;
  email: string;
  phone: string;
  leaseTerm?: string;
  pets?: string;
  specialRequest?: string;
  comments?: string;
  checkedInAt: string;
}

function storageKey(propertyId: string, sessionId: string): string {
  return `${STORAGE_PREFIX}:${propertyId}:${sessionId}`;
}

export function saveOpenInspectionCheckIn(checkIn: StoredOpenInspectionCheckIn): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(storageKey(checkIn.propertyId, checkIn.sessionId), JSON.stringify(checkIn));
  } catch {
    // Ignore quota / private mode errors — apply can still prompt check-in.
  }
}

export function loadOpenInspectionCheckIn(
  propertyId: string,
  sessionId: string,
): StoredOpenInspectionCheckIn | null {
  if (typeof window === 'undefined' || !sessionId) return null;
  try {
    const raw = sessionStorage.getItem(storageKey(propertyId, sessionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredOpenInspectionCheckIn;
    if (parsed.propertyId !== propertyId || parsed.sessionId !== sessionId) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Prefer YYYY-MM-DD for API validation; fall back to today. */
export function defaultMoveInDate(availableFrom?: string | null): string {
  const trimmed = availableFrom?.trim();
  if (trimmed && /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}
