'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { AreaAvailablePrompt } from '@/components/tenant/area-available-prompt';
import {
  RoutineSectionPhotoGrid,
  type SectionPhotos,
} from '@/components/tenant/routine-section-photo-grid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  INSPECTION_AREA_CATALOG,
  sectionAreaName,
} from '@/constants/inspection-areas';
import type { TenantRoutineInspection } from '@/lib/crossub-api/tenant-account-client';
import {
  startTenantRoutineSelfInspection,
  submitTenantRoutineSelfInspection,
} from '@/lib/crossub-api/tenant-account-client';
import { cn } from '@/lib/utils';

type AreaIssue = {
  available: boolean | null;
  notes: string;
  activeSections: string[];
  photosBySection: Record<string, SectionPhotos>;
};

const emptySectionPhotos = (): SectionPhotos => ({
  routinePhotoUrls: [],
});

function emptyAreaIssue(): AreaIssue {
  return {
    available: null,
    notes: '',
    activeSections: [],
    photosBySection: {},
  };
}

export function RoutineSelfInspectionWizard({
  inspection,
  onUpdated,
}: {
  inspection: TenantRoutineInspection;
  onUpdated: (next: TenantRoutineInspection) => void;
}) {
  const scheduleKey = inspection.scheduleId ?? inspection.id;

  const [starting, setStarting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState(false);
  const [areaIndex, setAreaIndex] = useState(0);
  const [issues, setIssues] = useState<Record<string, AreaIssue>>({});

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setStarting(true);
      try {
        const next = await startTenantRoutineSelfInspection(scheduleKey);
        if (!cancelled) {
          onUpdated(next);
          setStarted(true);
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : 'Could not start self-inspection');
        }
      } finally {
        if (!cancelled) setStarting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- start once per schedule
  }, [scheduleKey]);

  const areaDef = INSPECTION_AREA_CATALOG[areaIndex];
  const area = areaDef.name;
  const issue = issues[area] ?? emptyAreaIssue();
  const isLast = areaIndex === INSPECTION_AREA_CATALOG.length - 1;

  const updateIssue = (patch: Partial<AreaIssue>) => {
    setIssues((prev) => ({
      ...prev,
      [area]: { ...(prev[area] ?? emptyAreaIssue()), ...patch },
    }));
  };

  const markAvailable = (available: boolean) => {
    if (!available) {
      setIssues((prev) => ({
        ...prev,
        [area]: { ...emptyAreaIssue(), available: false },
      }));
      if (!isLast) setAreaIndex((index) => index + 1);
      return;
    }

    const photosBySection: Record<string, SectionPhotos> = {};
    for (const section of areaDef.defaultSections) {
      photosBySection[section] = emptySectionPhotos();
    }
    updateIssue({
      available: true,
      activeSections: [...areaDef.defaultSections],
      photosBySection,
    });
  };

  const addSection = (section: string) => {
    const current = issues[area] ?? emptyAreaIssue();
    if (current.activeSections.includes(section)) return;
    updateIssue({
      activeSections: [...current.activeSections, section],
      photosBySection: {
        ...current.photosBySection,
        [section]: emptySectionPhotos(),
      },
    });
  };

  const removeSection = (section: string) => {
    if (areaDef.defaultSections.includes(section)) return;
    const current = issues[area] ?? emptyAreaIssue();
    const nextPhotos = { ...current.photosBySection };
    delete nextPhotos[section];
    updateIssue({
      activeSections: current.activeSections.filter((item) => item !== section),
      photosBySection: nextPhotos,
    });
  };

  const buildSubmission = (finalIssues: Record<string, AreaIssue>) => {
    const sections: Array<{ areaName: string; comment?: string; photoUrls: string[] }> = [];
    for (const def of INSPECTION_AREA_CATALOG) {
      const rec = finalIssues[def.name];
      if (rec?.available !== true) continue;
      let notesUsed = false;
      for (const section of rec.activeSections) {
        const photos = rec.photosBySection[section]?.routinePhotoUrls ?? [];
        if (photos.length === 0) continue;
        sections.push({
          areaName: sectionAreaName(def.name, section),
          comment:
            !notesUsed && rec.notes.trim() ? rec.notes.trim() : undefined,
          photoUrls: photos,
        });
        notesUsed = true;
      }
    }
    return sections;
  };

  const submitAll = async (finalIssues: Record<string, AreaIssue>) => {
    const sections = buildSubmission(finalIssues);
    if (sections.length === 0) {
      toast.error('Photograph at least one section before submitting');
      return;
    }
    setBusy(true);
    try {
      const next = await submitTenantRoutineSelfInspection(scheduleKey, sections);
      onUpdated(next);
      toast.success('Self-inspection submitted — your property manager will review it');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not submit self-inspection');
    } finally {
      setBusy(false);
    }
  };

  const nextArea = async () => {
    if (issue.available !== true) {
      toast.error('Confirm whether this area is available');
      return;
    }
    if (issue.activeSections.length === 0) {
      toast.error('Add at least one section to photograph, or skip this area');
      return;
    }
    for (const section of issue.activeSections) {
      const photos = issue.photosBySection[section]?.routinePhotoUrls ?? [];
      if (photos.length === 0) {
        toast.error(`Add at least one routine photo for “${section}”`);
        return;
      }
    }

    if (isLast) {
      await submitAll({ ...issues, [area]: issue });
      return;
    }
    setAreaIndex((index) => index + 1);
  };

  const progressTone = (index: number, areaName: string) => {
    const rec = issues[areaName];
    if (index === areaIndex) return 'bg-primary';
    if (rec?.available === false) return 'bg-muted-foreground/40';
    if (rec?.available === true) return 'bg-primary/70';
    if (index < areaIndex) return 'bg-primary/40';
    return 'bg-secondary';
  };

  if (starting || !started) {
    return (
      <div className="flex items-center gap-2 rounded-xl border bg-card p-4 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Preparing your self-inspection checklist…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-xs">
        Walk through each area and upload current condition photos for each section.
      </p>

      <div className="flex gap-1">
        {INSPECTION_AREA_CATALOG.map((item, index) => (
          <button
            key={item.name}
            type="button"
            title={item.name}
            aria-label={`Go to ${item.name}`}
            className={cn('h-1.5 flex-1 rounded-full', progressTone(index, item.name))}
            onClick={() => setAreaIndex(index)}
          />
        ))}
      </div>

      {issue.available == null ? (
        <AreaAvailablePrompt
          areaName={area}
          areaIndex={areaIndex}
          totalAreas={INSPECTION_AREA_CATALOG.length}
          onYes={() => markAvailable(true)}
          onNo={() => markAvailable(false)}
        />
      ) : issue.available === false ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {area} — skipped ({areaIndex + 1}/{INSPECTION_AREA_CATALOG.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => markAvailable(true)}
            >
              Mark available & photograph
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={areaIndex === 0}
                onClick={() => setAreaIndex((index) => index - 1)}
              >
                <ChevronLeft className="size-4" />
                Back
              </Button>
              {isLast ? (
                <Button
                  type="button"
                  className="flex-1"
                  disabled={busy}
                  onClick={() => void submitAll(issues)}
                >
                  Submit self-inspection
                </Button>
              ) : (
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => setAreaIndex((index) => index + 1)}
                >
                  Next area
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {area} ({areaIndex + 1}/{INSPECTION_AREA_CATALOG.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RoutineSectionPhotoGrid
              definition={areaDef}
              activeSections={issue.activeSections}
              photosBySection={issue.photosBySection}
              busy={busy}
              onAddSection={addSection}
              onRemoveSection={removeSection}
              onRoutinePhotosChange={(section, urls) => {
                const current = issues[area] ?? emptyAreaIssue();
                const existing = current.photosBySection[section] ?? emptySectionPhotos();
                updateIssue({
                  photosBySection: {
                    ...current.photosBySection,
                    [section]: { ...existing, routinePhotoUrls: urls },
                  },
                });
              }}
            />

            <div className="space-y-1.5">
              <label htmlFor={`notes-${area}`} className="text-sm font-medium">
                Area notes (optional)
              </label>
              <Input
                id={`notes-${area}`}
                value={issue.notes}
                placeholder="Note anything unusual in this area"
                onChange={(event) => updateIssue({ notes: event.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={areaIndex === 0 || busy}
                onClick={() => setAreaIndex((index) => index - 1)}
              >
                <ChevronLeft className="size-4" />
                Back
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={busy}
                onClick={() => void nextArea()}
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : isLast ? (
                  'Submit self-inspection'
                ) : (
                  'Next area'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
