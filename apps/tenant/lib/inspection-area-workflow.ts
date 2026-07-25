import { parseSectionAreaName } from '@/constants/inspection-areas';
import {
  isCustomAreaName,
  resolveAreaDefinition,
  type CustomAreaDefinition,
} from '@/lib/custom-inspection-areas';

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

/** Sections for an outgoing/routine room — ingoing plan wins over catalog defaults. */
export function outgoingSectionsForRoom(
  plan: IngoingAreaPlan | null | undefined,
  roomName: string,
): string[] {
  const fromPlan = findIngoingPlanRoom(plan, roomName)?.sections;
  if (fromPlan?.length) return [...fromPlan];
  const def = resolveAreaDefinition(roomName);
  return [...(def?.defaultSections ?? [])];
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
  areaName: string,
  customAreas: CustomAreaDefinition[],
  ingoingAreaPlan: IngoingAreaPlan | null,
): string[] {
  if (isCustomAreaName(areaName, customAreas)) {
    return [...resolveAreaDefinition(areaName, customAreas).defaultSections];
  }
  return outgoingSectionsForRoom(ingoingAreaPlan, areaName);
}

export function setupStartLabel(continuing: boolean): string {
  return continuing ? 'Continue inspection' : 'Start inspection';
}
