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

function hostedPhotoUrls(urls: string[] | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls ?? []) {
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed) || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

function mergeAreaDrafts(
  base: RoutineSelfAreaDraft | undefined,
  overlay: RoutineSelfAreaDraft | undefined,
): RoutineSelfAreaDraft {
  const left = base ?? emptyRoutineSelfAreaDraft();
  const right = overlay ?? emptyRoutineSelfAreaDraft();
  return {
    skipped: left.skipped || right.skipped,
    notes: right.notes.trim() || left.notes,
    photoUrls: hostedPhotoUrls([...left.photoUrls, ...right.photoUrls]),
  };
}

export type ServerRoutineSelfDraft = {
  updatedAt?: string;
  areaIndex?: number;
  areaOrder?: string[];
  areas: Array<{
    areaName: string;
    skipped?: boolean;
    notes?: string;
    photoUrls?: string[];
  }>;
};

export function serverDraftToLocal(
  scheduleKey: string,
  server: ServerRoutineSelfDraft,
): RoutineSelfInspectionDraft {
  const areas: Record<string, RoutineSelfAreaDraft> = {};
  for (const row of server.areas) {
    const name = row.areaName.trim();
    if (!name) continue;
    areas[name] = mergeAreaDrafts(areas[name], {
      skipped: row.skipped === true,
      notes: row.notes?.trim() ?? '',
      photoUrls: hostedPhotoUrls(row.photoUrls),
    });
  }
  return {
    scheduleKey,
    areaIndex: typeof server.areaIndex === 'number' ? server.areaIndex : 0,
    areas,
    started: true,
    areaOrder: server.areaOrder,
  };
}

export function mergeRoutineSelfInspectionDrafts(
  scheduleKey: string,
  local: RoutineSelfInspectionDraft | null,
  server: RoutineSelfInspectionDraft | null,
): RoutineSelfInspectionDraft | null {
  if (!local && !server) return null;
  if (!local) return server;
  if (!server) return local;
  const names = new Set([
    ...Object.keys(local.areas),
    ...Object.keys(server.areas),
  ]);
  const areas: Record<string, RoutineSelfAreaDraft> = {};
  for (const name of names) {
    areas[name] = mergeAreaDrafts(local.areas[name], server.areas[name]);
  }
  const orderSource = [
    ...(local.areaOrder ?? []),
    ...(server.areaOrder ?? []),
    ...names,
  ];
  return {
    scheduleKey,
    areaIndex: Math.max(local.areaIndex, server.areaIndex),
    areas,
    started: local.started || server.started,
    areaOrder: mergeAreaOrder(local.areaOrder ?? server.areaOrder, orderSource),
  };
}

export function toServerDraftPayload(draft: RoutineSelfInspectionDraft): {
  areaIndex: number;
  areaOrder?: string[];
  areas: Array<{
    areaName: string;
    skipped: boolean;
    notes: string;
    photoUrls: string[];
  }>;
} {
  return {
    areaIndex: draft.areaIndex,
    ...(draft.areaOrder?.length ? { areaOrder: draft.areaOrder } : {}),
    areas: Object.entries(draft.areas).map(([areaName, row]) => ({
      areaName,
      skipped: row.skipped,
      notes: row.notes,
      photoUrls: hostedPhotoUrls(row.photoUrls),
    })),
  };
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
