const STORAGE_PREFIX = 'crossub-tenant-routine-self-v2:';

export type RoutineSelfAreaDraft = {
  skipped: boolean;
  notes: string;
  photoUrls: string[];
  /** null = not answered yet */
  maintenanceRequest: boolean | null;
};

export type RoutineSelfInspectionDraft = {
  scheduleKey: string;
  areaIndex: number;
  areas: Record<string, RoutineSelfAreaDraft>;
  started: boolean;
  /** Tenant walk order, including added rooms and omitting deleted ones. */
  areaOrder?: string[];
};

/**
 * When the tenant has already set a walk order (reorder / add / delete), keep it.
 * Otherwise seed from the bedroom-count template.
 */
export function resolveWalkOrder(
  saved: string[] | undefined,
  template: string[],
): string[] {
  if (!saved?.length) return template;
  const used = new Set<string>();
  const ordered: string[] = [];
  for (const name of saved) {
    const trimmed = name.trim();
    if (!trimmed || used.has(trimmed.toLowerCase())) continue;
    used.add(trimmed.toLowerCase());
    ordered.push(trimmed);
  }
  return ordered.length > 0 ? ordered : template;
}

export function mergeAreaOrder(saved: string[] | undefined, source: string[]): string[] {
  return resolveWalkOrder(saved, source);
}

function storageKey(scheduleKey: string): string {
  return `${STORAGE_PREFIX}${scheduleKey}`;
}

export function emptyRoutineSelfAreaDraft(): RoutineSelfAreaDraft {
  return { skipped: false, notes: '', photoUrls: [], maintenanceRequest: null };
}

export function isRoutineSelfAreaComplete(area: RoutineSelfAreaDraft | undefined): boolean {
  if (!area) return false;
  if (area.skipped) return true;
  return area.photoUrls.length > 0 && area.maintenanceRequest != null;
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

function parseMaintenanceRequest(value: unknown): boolean | null {
  if (value === true) return true;
  if (value === false) return false;
  return null;
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
    maintenanceRequest:
      right.maintenanceRequest != null
        ? right.maintenanceRequest
        : left.maintenanceRequest,
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
    maintenanceRequest?: boolean | null;
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
      maintenanceRequest: parseMaintenanceRequest(row.maintenanceRequest),
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
  const savedOrder = local.areaOrder?.length
    ? local.areaOrder
    : server.areaOrder;
  return {
    scheduleKey,
    areaIndex: Math.max(local.areaIndex, server.areaIndex),
    areas,
    started: local.started || server.started,
    areaOrder: resolveWalkOrder(savedOrder, [...names]),
  };
}

export function toServerDraftPayload(draft: RoutineSelfInspectionDraft): {
  areaIndex: number;
  areaOrder?: string[];
  areas: Array<{
    areaName: string;
    skipped: boolean;
    notes: string;
    maintenanceRequest: boolean | null;
    photoUrls: string[];
  }>;
} {
  const order = draft.areaOrder?.length
    ? resolveWalkOrder(draft.areaOrder, Object.keys(draft.areas))
    : Object.keys(draft.areas);
  return {
    areaIndex: draft.areaIndex,
    ...(order.length ? { areaOrder: order } : {}),
    areas: order.map((areaName) => {
      const row = draft.areas[areaName] ?? emptyRoutineSelfAreaDraft();
      return {
        areaName,
        skipped: row.skipped,
        notes: row.notes,
        maintenanceRequest: row.maintenanceRequest,
        photoUrls: hostedPhotoUrls(row.photoUrls),
      };
    }),
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
