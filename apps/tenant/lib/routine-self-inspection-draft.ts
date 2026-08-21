const STORAGE_PREFIX = 'crossub-tenant-routine-self-v2:';

export type RoutineSelfAreaDraft = {
  skipped: boolean;
  notes: string;
  photoUrls: string[];
};

export type RoutineSelfInspectionDraft = {
  scheduleKey: string;
  areaIndex: number;
  areas: Record<string, RoutineSelfAreaDraft>;
  started: boolean;
  /** Tenant-sorted walk order. Missing on older drafts. */
  areaOrder?: string[];
};

export function mergeAreaOrder(saved: string[] | undefined, source: string[]): string[] {
  if (!source.length) return [];
  if (!saved?.length) return source;
  const canonicalByKey = new Map(source.map((name) => [name.trim().toLowerCase(), name]));
  const used = new Set<string>();
  const ordered: string[] = [];
  for (const name of saved) {
    const canonical = canonicalByKey.get(name.trim().toLowerCase());
    if (!canonical || used.has(canonical.toLowerCase())) continue;
    used.add(canonical.toLowerCase());
    ordered.push(canonical);
  }
  for (const name of source) {
    if (!used.has(name.toLowerCase())) ordered.push(name);
  }
  return ordered;
}

function storageKey(scheduleKey: string): string {
  return `${STORAGE_PREFIX}${scheduleKey}`;
}

export function emptyRoutineSelfAreaDraft(): RoutineSelfAreaDraft {
  return { skipped: false, notes: '', photoUrls: [] };
}

export function loadRoutineSelfInspectionDraft(
  scheduleKey: string,
): RoutineSelfInspectionDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey(scheduleKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RoutineSelfInspectionDraft;
    if (parsed.scheduleKey !== scheduleKey) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasRoutineSelfInspectionDraft(scheduleKey: string): boolean {
  return Boolean(loadRoutineSelfInspectionDraft(scheduleKey));
}

export function persistRoutineSelfInspectionDraft(
  draft: RoutineSelfInspectionDraft,
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey(draft.scheduleKey), JSON.stringify(draft));
  } catch {
    // Storage full — wizard state still holds progress this session.
  }
}

export function clearRoutineSelfInspectionDraft(scheduleKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(storageKey(scheduleKey));
  } catch {
    // ignore
  }
}
