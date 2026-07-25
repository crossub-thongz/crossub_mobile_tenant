'use client';

import { X } from 'lucide-react';
import { useMemo } from 'react';

import { AddSectionControl } from '@/components/tenant/add-section-control';
import { RoutinePhotoColumn } from '@/components/tenant/routine-photo-column';
import type { InspectionAreaDefinition } from '@/constants/inspection-areas';
import { COMMON_DEFAULT_SECTIONS } from '@/constants/inspection-areas';

export type SectionPhotos = {
  routinePhotoUrls: string[];
};

export function RoutineSectionPhotoGrid({
  definition,
  activeSections,
  photosBySection,
  busy = false,
  onAddSection,
  onRemoveSection,
  onRoutinePhotosChange,
}: {
  definition: InspectionAreaDefinition;
  activeSections: string[];
  photosBySection: Record<string, SectionPhotos>;
  busy?: boolean;
  onAddSection: (section: string) => void;
  onRemoveSection: (section: string) => void;
  onRoutinePhotosChange: (section: string, urls: string[]) => void;
}) {
  const defaultSet = useMemo(
    () => new Set(definition.defaultSections),
    [definition.defaultSections],
  );
  const sectionPickerOptions = useMemo(() => {
    const merged = new Set<string>([
      ...definition.optionalSections,
      ...COMMON_DEFAULT_SECTIONS,
    ]);
    return [...merged];
  }, [definition.optionalSections]);

  return (
    <div className="space-y-4">
      {activeSections.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          No sections yet. Add one from the list below to start photographing.
        </p>
      ) : (
        activeSections.map((section) => {
          const isDefault = defaultSet.has(section);
          const photos = photosBySection[section] ?? {
            routinePhotoUrls: [],
          };
          return (
            <div key={section} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug">{section}</p>
                {!isDefault ? (
                  <button
                    type="button"
                    onClick={() => onRemoveSection(section)}
                    className="text-muted-foreground hover:text-foreground shrink-0 rounded-md p-1"
                    aria-label={`Remove ${section}`}
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </div>
              <RoutinePhotoColumn
                title="Routine"
                photoUrls={photos.routinePhotoUrls}
                uploading={busy}
                disabled={busy}
                onPhotosChange={(urls) => onRoutinePhotosChange(section, urls)}
              />
            </div>
          );
        })
      )}

      <AddSectionControl
        optionalSections={sectionPickerOptions}
        activeSections={activeSections}
        busy={busy}
        onAddSection={onAddSection}
      />
    </div>
  );
}
