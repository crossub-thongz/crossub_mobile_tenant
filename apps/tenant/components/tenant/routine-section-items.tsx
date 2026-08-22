'use client';

import { useMemo, useState } from 'react';

import { AddSectionControl } from '@/components/tenant/add-section-control';
import { DraggableNamedList } from '@/components/tenant/draggable-named-list';
import { EditableChecklistRow } from '@/components/tenant/editable-checklist-row';
import { ItemConditionColumnBar } from '@/components/tenant/item-condition-column-bar';
import { ItemConditionToggles } from '@/components/tenant/item-condition-toggles';
import { RenameLabelDialog } from '@/components/tenant/rename-label-dialog';
import { RoutinePhotoColumn } from '@/components/tenant/routine-photo-column';
import { Input } from '@/components/ui/input';
import type { InspectionAreaDefinition } from '@/constants/inspection-areas';
import {
  emptyItemMarks,
  type ItemConditionKey,
  type ItemConditionMarks,
} from '@/lib/item-condition-marks';
import { validateUniqueLabel } from '@/lib/inspection-layout-edit';
import { buildSectionPickerOptions } from '@/lib/inspection-section-utils';

export type SectionPhotos = {
  routinePhotoUrls: string[];
};

export function RoutineSectionItems({
  definition,
  activeSections,
  photosBySection,
  itemMarks,
  itemComments,
  ingoingPhotosBySection,
  busy = false,
  onAddSection,
  onRemoveSection,
  onRenameSection,
  onMoveSection,
  onChangeMarks,
  onFillColumn,
  onChangeComment,
  onRoutinePhotosChange,
}: {
  definition: InspectionAreaDefinition;
  activeSections: string[];
  photosBySection: Record<string, SectionPhotos>;
  itemMarks?: Record<string, ItemConditionMarks>;
  itemComments?: Record<string, string>;
  ingoingPhotosBySection?: Record<string, string[]>;
  busy?: boolean;
  onAddSection: (section: string) => void;
  onRemoveSection: (section: string) => void;
  onRenameSection: (from: string, to: string) => void;
  onMoveSection: (from: number, to: number) => void;
  onChangeMarks: (section: string, marks: ItemConditionMarks) => void;
  onFillColumn: (key: ItemConditionKey, value: boolean) => void;
  onChangeComment: (section: string, comment: string) => void;
  onRoutinePhotosChange: (section: string, urls: string[]) => void;
}) {
  const [renameFrom, setRenameFrom] = useState<string | null>(null);

  const sectionPickerOptions = useMemo(
    () => buildSectionPickerOptions(definition),
    [definition],
  );

  return (
    <div className="space-y-4">
      {activeSections.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          No items yet. Add one below, then mark Clean / Undamaged / Working.
        </p>
      ) : (
        <>
          <p className="text-muted-foreground text-xs">
            Drag the handle on the left to reorder. Tap edit to rename an item.
            Hold Yes / No on a mark to fill that column for every item.
          </p>
          <ItemConditionColumnBar disabled={busy} onFillColumn={onFillColumn} />
          <ul className="space-y-4">
            <DraggableNamedList
              items={activeSections}
              variant="card"
              disabled={busy}
              onReorder={onMoveSection}
              renderItem={(section) => {
                const photos = photosBySection[section] ?? { routinePhotoUrls: [] };
                const ingoing = ingoingPhotosBySection?.[section] ?? [];
                return (
                  <EditableChecklistRow
                    name={section}
                    busy={busy}
                    onRename={() => setRenameFrom(section)}
                    onRemove={() => onRemoveSection(section)}
                  >
                    <ItemConditionToggles
                      marks={itemMarks?.[section] ?? emptyItemMarks()}
                      disabled={busy}
                      onChange={(marks) => onChangeMarks(section, marks)}
                      onFillColumn={onFillColumn}
                    />
                    <Input
                      placeholder="Comment (optional)"
                      value={itemComments?.[section] ?? ''}
                      disabled={busy}
                      onChange={(event) => onChangeComment(section, event.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <RoutinePhotoColumn
                        title="Ingoing"
                        photoUrls={ingoing}
                        disabled
                      />
                      <RoutinePhotoColumn
                        title="Routine"
                        photoUrls={photos.routinePhotoUrls}
                        uploading={busy}
                        sessionKey={section}
                        onPhotosChange={(urls) => onRoutinePhotosChange(section, urls)}
                      />
                    </div>
                  </EditableChecklistRow>
                );
              }}
            />
          </ul>
        </>
      )}

      <AddSectionControl
        optionalSections={sectionPickerOptions}
        activeSections={activeSections}
        busy={busy}
        onAddSection={onAddSection}
      />

      <RenameLabelDialog
        open={Boolean(renameFrom)}
        title="Rename item"
        initialValue={renameFrom ?? ''}
        onClose={() => setRenameFrom(null)}
        onConfirm={(value) => {
          if (!renameFrom) return null;
          const error = validateUniqueLabel(value, activeSections, renameFrom);
          if (error) return error;
          onRenameSection(renameFrom, value.trim().replace(/\s+/g, ' '));
          return null;
        }}
      />
    </div>
  );
}
