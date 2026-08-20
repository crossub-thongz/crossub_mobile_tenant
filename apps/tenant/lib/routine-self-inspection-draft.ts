import type { CustomAreaDefinition } from '@/lib/custom-inspection-areas';
import type { ItemConditionMarks } from '@/lib/item-condition-marks';

const STORAGE_PREFIX = 'crossub-tenant-routine-self:';

export type RoutineSelfSectionPhotos = {
  routinePhotoUrls: string[];
};

export type RoutineSelfAreaIssueDraft = {
  available: boolean | null;
  notes: string;
  activeSections: string[];
  photosBySection: Record<string, RoutineSelfSectionPhotos>;
  areaPhotos?: string[];
  itemMarks?: Record<string, ItemConditionMarks>;
  itemComments?: Record<string, string>;
};

export type RoutineSelfInspectionDraft = {
  scheduleKey: string;
  areaIndex: number;
  issues: Record<string, RoutineSelfAreaIssueDraft>;
  customAreas: CustomAreaDefinition[];
  selectedAreaNames: string[];
  areaSetupComplete: boolean;
  started: boolean;
};

function storageKey(scheduleKey: string): string {
  return `${STORAGE_PREFIX}${scheduleKey}`;
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
