'use client';

import { Plus, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { RoutinePhotoColumn } from '@/components/tenant/routine-photo-column';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { InspectionAreaDefinition } from '@/constants/inspection-areas';

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
  const [pick, setPick] = useState('');
  const defaultSet = useMemo(
    () => new Set(definition.defaultSections),
    [definition.defaultSections],
  );
  const availableOptional = useMemo(
    () =>
      definition.optionalSections.filter((section) => !activeSections.includes(section)),
    [definition.optionalSections, activeSections],
  );

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

      {availableOptional.length > 0 ? (
        <div className="space-y-2">
          <Label htmlFor="add-routine-section">Add section</Label>
          <div className="flex gap-2">
            <select
              id="add-routine-section"
              className="border-input bg-background h-9 min-w-0 flex-1 rounded-md border px-3 text-sm"
              value={pick}
              disabled={busy}
              onChange={(event) => setPick(event.target.value)}
            >
              <option value="">Select a section…</option>
              {availableOptional.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0"
              disabled={busy || !pick}
              onClick={() => {
                if (!pick) return;
                onAddSection(pick);
                setPick('');
              }}
            >
              <Plus className="size-4" />
              Add
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
