import { parseSectionAreaName } from '@/constants/inspection-areas';
import { type CustomAreaDefinition } from '@/lib/custom-inspection-areas';

export type IngoingAreaPlan = {
  rooms: Array<{ name: string; sections: string[] }>;
};

export type IngoingAreaPlanRoom = IngoingAreaPlan['rooms'][number];

export function findIngoingPlanRoom(
  plan: IngoingAreaPlan | null | undefined,
  roomName: string,
): IngoingAreaPlanRoom | undefined {
  if (!plan) return undefined;
  const target = roomName.trim().toLowerCase();
  return plan.rooms.find((room) => room.name.trim().toLowerCase() === target);
}

/** Tenant self-routine is overall-room photos only. */
export function outgoingSectionsForRoom(
  _plan: IngoingAreaPlan | null | undefined,
  _roomName: string,
): string[] {
  return [];
}

export function isAreaSetupComplete(areaSetupComplete: boolean): boolean {
  return areaSetupComplete === true;
}

export function existingAreaNamesFromPlan(
  plan: IngoingAreaPlan | null | undefined,
): string[] {
  return plan?.rooms.map((room) => room.name) ?? [];
}

export function buildAreaPlanFromReferenceAreas(
  areas: Array<{ name: string }>,
): IngoingAreaPlan | null {
  if (areas.length === 0) return null;

  const roomMap = new Map<string, Set<string>>();
  for (const area of areas) {
    const raw = area.name.replace(/\s*\(ingoing\)\s*$/i, '').trim();
    if (!raw) continue;
    const parsed = parseSectionAreaName(raw);
    if (parsed) {
      const sections = roomMap.get(parsed.area) ?? new Set<string>();
      sections.add(parsed.section);
      roomMap.set(parsed.area, sections);
      continue;
    }
    if (!roomMap.has(raw)) roomMap.set(raw, new Set());
  }

  const rooms = [...roomMap.entries()].map(([name, sections]) => ({
    name,
    sections: [...sections],
  }));
  return rooms.length > 0 ? { rooms } : null;
}

export function resolveIngoingAreaPlan(
  referenceAreas: Array<{ name: string }>,
): IngoingAreaPlan | null {
  return buildAreaPlanFromReferenceAreas(referenceAreas);
}

export function sectionsForAvailableArea(
  _areaName: string,
  _customAreas: CustomAreaDefinition[],
  _ingoingAreaPlan: IngoingAreaPlan | null,
): string[] {
  return [];
}

type AreaRecordBase = {
  available: boolean | null;
  activeSections: string[];
  photosBySection: Record<string, unknown>;
};

/** After Start, every selected room is available with its items pre-seeded. */
export function seedAreasForInspectionStart<T extends AreaRecordBase>(
  record: Record<string, T>,
  areaNames: string[],
  options: {
    sectionsFor: (name: string) => string[];
    emptyEntry: (name: string) => T;
    emptyPhotos: () => T['photosBySection'][string];
  },
): { record: Record<string, T>; changed: boolean } {
  let changed = false;
  const next = { ...record };

  for (const name of areaNames) {
    const current = next[name] ?? options.emptyEntry(name);
    if (current.available === false) {
      if (!next[name]) {
        next[name] = current;
        changed = true;
      }
      continue;
    }

    if (current.available === true) {
      if (!next[name]) {
        next[name] = current;
        changed = true;
      }
      continue;
    }

    const needsActivate = current.available !== true;
    const needsSections = current.activeSections.length === 0;
    if (!needsActivate && !needsSections && next[name]) continue;

    const activeSections = needsSections
      ? options.sectionsFor(name)
      : [...current.activeSections];
    const photosBySection = { ...current.photosBySection };
    for (const section of activeSections) {
      if (photosBySection[section] == null) {
        photosBySection[section] = options.emptyPhotos();
      }
    }

    next[name] = {
      ...current,
      available: true,
      activeSections,
      photosBySection,
    };
    changed = true;
  }

  return { record: next, changed };
}

export function layoutFromIngoingPlan(
  plan: IngoingAreaPlan | null | undefined,
): { names: string[]; customAreas: CustomAreaDefinition[] } | null {
  if (!plan?.rooms.length) return null;
  const names: string[] = [];
  const customAreas: CustomAreaDefinition[] = [];
  for (const room of plan.rooms) {
    const name = room.name.trim();
    if (!name) continue;
    names.push(name);
    customAreas.push({
      name,
      sectionMode: 'manual',
      defaultSections: [],
      optionalSections: [],
    });
  }
  if (names.length === 0) return null;
  return { names, customAreas };
}

export function setupStartLabel(continuing: boolean): string {
  return continuing ? 'Continue inspection' : 'Start inspection';
}
