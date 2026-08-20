'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { InspectionAreaNav } from '@/components/tenant/inspection-area-nav';
import { InspectionAreaSetupPanel } from '@/components/tenant/inspection-area-setup-panel';
import { ResetInspectionDialog } from '@/components/tenant/reset-inspection-dialog';
import { RoutinePhotoColumn } from '@/components/tenant/routine-photo-column';
import { RoutineSectionItems } from '@/components/tenant/routine-section-items';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  buildExecutionAreaCatalog,
  inferSelectedAreaNamesFromDraft,
  normalizeCustomAreaName,
  type CustomAreaDefinition,
  type CustomAreaSectionMode,
} from '@/lib/custom-inspection-areas';
import type { TenantRoutineInspection } from '@/lib/crossub-api/tenant-account-client';
import {
  startTenantRoutineSelfInspection,
  submitTenantRoutineSelfInspection,
} from '@/lib/crossub-api/tenant-account-client';
import {
  applyColumnMark,
  firstIncompleteSection,
  serializeItemMarks,
  type ItemConditionKey,
  type ItemConditionMarks,
} from '@/lib/item-condition-marks';
import { moveIndex, rekeyRecord } from '@/lib/inspection-layout-edit';
import { matchReferenceSectionPhotos } from '@/lib/outgoing-reference-photos';
import {
  clearRoutineSelfInspectionDraft,
  loadRoutineSelfInspectionDraft,
  persistRoutineSelfInspectionDraft,
} from '@/lib/routine-self-inspection-draft';
import {
  existingAreaNamesFromPlan,
  layoutFromIngoingPlan,
  resolveIngoingAreaPlan,
  seedAreasForInspectionStart,
  sectionsForAvailableArea,
  type IngoingAreaPlan,
} from '@/lib/inspection-area-workflow';

type AreaIssue = {
  available: boolean | null;
  notes: string;
  activeSections: string[];
  photosBySection: Record<string, { routinePhotoUrls: string[] }>;
  areaPhotos?: string[];
  itemMarks?: Record<string, ItemConditionMarks>;
  itemComments?: Record<string, string>;
};

const emptySectionPhotos = () => ({ routinePhotoUrls: [] as string[] });

function emptyAreaIssue(): AreaIssue {
  return {
    available: null,
    notes: '',
    activeSections: [],
    photosBySection: {},
    areaPhotos: [],
    itemMarks: {},
    itemComments: {},
  };
}

function mergeCustomAreas(
  existing: CustomAreaDefinition[],
  extras: CustomAreaDefinition[],
): CustomAreaDefinition[] {
  const next = [...existing];
  const indexByKey = new Map(
    next.map((area, index) => [area.name.trim().toLowerCase(), index] as const),
  );
  for (const extra of extras) {
    const key = extra.name.trim().toLowerCase();
    if (!key) continue;
    const index = indexByKey.get(key);
    if (index == null) {
      indexByKey.set(key, next.length);
      next.push(extra);
      continue;
    }
    if (extra.defaultSections?.length) {
      next[index] = { ...next[index], ...extra, name: extra.name.trim() || next[index].name };
    }
  }
  return next;
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
  const [restoredDraft, setRestoredDraft] = useState(false);
  const [resumingFromDraft, setResumingFromDraft] = useState(false);
  const [areaIndex, setAreaIndex] = useState(0);
  const [issues, setIssues] = useState<Record<string, AreaIssue>>({});
  const [customAreas, setCustomAreas] = useState<CustomAreaDefinition[]>([]);
  const [selectedAreaNames, setSelectedAreaNames] = useState<string[]>([]);
  const [areaSetupComplete, setAreaSetupComplete] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [ingoingAreaPlan, setIngoingAreaPlan] = useState<IngoingAreaPlan | null>(null);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const referenceIngoingAreas = useMemo(
    () =>
      (
        inspection as {
          referenceIngoingAreas?: Array<{ name: string; photos: string[] }>;
        }
      ).referenceIngoingAreas ?? [],
    [inspection],
  );

  useEffect(() => {
    const refAreas =
      referenceIngoingAreas.map((area) => ({
        name: area.name,
        photos: area.photos.map((url: string) => ({ url })),
      })) ?? [];
    setIngoingAreaPlan(resolveIngoingAreaPlan(refAreas));
  }, [referenceIngoingAreas]);

  useEffect(() => {
    const saved = loadRoutineSelfInspectionDraft(scheduleKey);
    if (!saved) {
      setRestoredDraft(true);
      return;
    }
    setResumingFromDraft(true);
    setAreaIndex(saved.areaIndex);
    setIssues(saved.issues);
    setCustomAreas(saved.customAreas);
    setSelectedAreaNames(saved.selectedAreaNames);
    setAreaSetupComplete(saved.areaSetupComplete);
    setStarted(saved.started);
    setRestoredDraft(true);
  }, [scheduleKey]);

  useEffect(() => {
    if (!started || !restoredDraft) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      const hasProgress =
        areaSetupComplete ||
        selectedAreaNames.length > 0 ||
        Object.keys(issues).length > 0;
      if (!hasProgress) {
        clearRoutineSelfInspectionDraft(scheduleKey);
        return;
      }
      persistRoutineSelfInspectionDraft({
        scheduleKey,
        areaIndex,
        issues,
        customAreas,
        selectedAreaNames,
        areaSetupComplete,
        started: true,
      });
    }, 350);
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [
    started,
    restoredDraft,
    scheduleKey,
    areaIndex,
    issues,
    customAreas,
    selectedAreaNames,
    areaSetupComplete,
  ]);

  useEffect(() => {
    if (!restoredDraft) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- start once per schedule after draft restore
  }, [scheduleKey, restoredDraft]);

  useEffect(() => {
    if (areaSetupComplete || selectedAreaNames.length > 0) return;
    const copied = layoutFromIngoingPlan(ingoingAreaPlan);
    if (!copied) return;
    setCustomAreas((prev) => mergeCustomAreas(prev, copied.customAreas));
    setSelectedAreaNames(copied.names);
    setIssues((prev) => {
      const next = { ...prev };
      for (const name of copied.names) {
        if (!next[name]) next[name] = emptyAreaIssue();
      }
      return next;
    });
  }, [areaSetupComplete, ingoingAreaPlan, selectedAreaNames.length]);

  const resolvedSelectedAreaNames =
    selectedAreaNames.length > 0
      ? selectedAreaNames
      : inferSelectedAreaNamesFromDraft(issues, customAreas);
  const areaCatalog = useMemo(
    () =>
      areaSetupComplete
        ? buildExecutionAreaCatalog(resolvedSelectedAreaNames, customAreas)
        : [],
    [areaSetupComplete, resolvedSelectedAreaNames, customAreas],
  );

  useEffect(() => {
    if (!areaSetupComplete || resolvedSelectedAreaNames.length === 0) return;
    setIssues((prev) => {
      const { record, changed } = seedAreasForInspectionStart(prev, resolvedSelectedAreaNames, {
        sectionsFor: (name) => sectionsForAvailableArea(name, customAreas, ingoingAreaPlan),
        emptyEntry: () => emptyAreaIssue(),
        emptyPhotos: emptySectionPhotos,
      });
      return changed ? record : prev;
    });
  }, [areaSetupComplete, customAreas, ingoingAreaPlan, resolvedSelectedAreaNames]);

  const safeAreaIndex = Math.min(
    Math.max(areaIndex, 0),
    Math.max(areaCatalog.length - 1, 0),
  );
  const areaDef = areaCatalog[safeAreaIndex];
  const area = areaDef?.name ?? areaCatalog[0]?.name ?? 'Area';
  const issue = issues[area] ?? emptyAreaIssue();
  const isLast = safeAreaIndex === areaCatalog.length - 1;
  const ingoingExistingAreas = existingAreaNamesFromPlan(ingoingAreaPlan);

  const addAllFromIngoing = () => {
    const copied = layoutFromIngoingPlan(ingoingAreaPlan);
    const names = (copied?.names ?? ingoingExistingAreas).filter(
      (name) =>
        !resolvedSelectedAreaNames.some(
          (selected) => selected.toLowerCase() === name.toLowerCase(),
        ),
    );
    if (names.length === 0) return;
    if (copied) setCustomAreas((prev) => mergeCustomAreas(prev, copied.customAreas));
    setSelectedAreaNames((prev) => [...prev, ...names]);
    setIssues((prev) => {
      const next = { ...prev };
      for (const name of names) {
        if (!next[name]) next[name] = emptyAreaIssue();
      }
      return next;
    });
    toast.success(`Added ${names.length} area(s) from the ingoing report`);
  };

  const handleAddBuiltInArea = (name: string) => {
    setSelectedAreaNames((prev) => [...prev, name]);
    setIssues((prev) => ({ ...prev, [name]: emptyAreaIssue() }));
  };

  const handleAddCustomArea = (name: string, sectionMode: CustomAreaSectionMode) => {
    const normalized = normalizeCustomAreaName(name);
    setCustomAreas((prev) => [...prev, { name: normalized, sectionMode }]);
    setSelectedAreaNames((prev) => [...prev, normalized]);
    setIssues((prev) => ({ ...prev, [normalized]: emptyAreaIssue() }));
  };

  const handleRemoveSetupArea = (name: string) => {
    setSelectedAreaNames((prev) => prev.filter((item) => item !== name));
    setCustomAreas((prev) => prev.filter((item) => item.name !== name));
    setIssues((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const updateIssue = (
    patch: Partial<AreaIssue> | ((current: AreaIssue) => Partial<AreaIssue>),
  ) => {
    setIssues((prev) => {
      const current = prev[area] ?? emptyAreaIssue();
      return {
        ...prev,
        [area]: { ...current, ...(typeof patch === 'function' ? patch(current) : patch) },
      };
    });
  };

  const markAvailable = (available: boolean) => {
    if (!available) {
      setIssues((prev) => ({
        ...prev,
        [area]: { ...emptyAreaIssue(), available: false },
      }));
      if (!isLast) setAreaIndex(safeAreaIndex + 1);
      return;
    }
    const sections = sectionsForAvailableArea(area, customAreas, ingoingAreaPlan);
    updateIssue((current) => {
      const photosBySection = { ...(current.photosBySection ?? {}) };
      for (const section of sections) {
        if (!photosBySection[section]) photosBySection[section] = emptySectionPhotos();
      }
      return { available: true, activeSections: sections, photosBySection };
    });
  };

  const addSection = (section: string) => {
    updateIssue((current) => {
      if (current.activeSections.includes(section)) return {};
      return {
        activeSections: [...current.activeSections, section],
        photosBySection: {
          ...current.photosBySection,
          [section]: emptySectionPhotos(),
        },
      };
    });
  };

  const removeSection = (section: string) => {
    updateIssue((current) => {
      const nextPhotos = { ...current.photosBySection };
      delete nextPhotos[section];
      const nextMarks = { ...(current.itemMarks ?? {}) };
      delete nextMarks[section];
      const nextComments = { ...(current.itemComments ?? {}) };
      delete nextComments[section];
      return {
        activeSections: current.activeSections.filter((item) => item !== section),
        photosBySection: nextPhotos,
        itemMarks: nextMarks,
        itemComments: nextComments,
      };
    });
  };

  const renameSection = (from: string, to: string) => {
    if (from === to) return;
    updateIssue((current) => ({
      activeSections: current.activeSections.map((name) => (name === from ? to : name)),
      photosBySection: rekeyRecord(current.photosBySection, from, to),
      itemMarks: rekeyRecord(current.itemMarks ?? {}, from, to),
      itemComments: rekeyRecord(current.itemComments ?? {}, from, to),
    }));
  };

  const moveSection = (from: number, to: number) => {
    updateIssue((current) => ({
      activeSections: moveIndex(current.activeSections, from, to),
    }));
  };

  const changeMarks = (section: string, marks: ItemConditionMarks) => {
    updateIssue((current) => ({
      itemMarks: { ...(current.itemMarks ?? {}), [section]: marks },
    }));
  };

  const fillColumn = (key: ItemConditionKey, value: boolean) => {
    updateIssue((current) => ({
      itemMarks: applyColumnMark(current.itemMarks, current.activeSections, key, value),
    }));
  };

  const changeItemComment = (section: string, comment: string) => {
    updateIssue((current) => ({
      itemComments: { ...(current.itemComments ?? {}), [section]: comment },
    }));
  };

  const buildSubmission = (finalIssues: Record<string, AreaIssue>) => {
    const sections: Array<{
      areaName: string;
      itemName?: string;
      comment?: string;
      photoUrls: string[];
      conditionTags?: string[];
    }> = [];
    for (const def of areaCatalog) {
      const rec = finalIssues[def.name];
      if (rec?.available !== true) continue;
      if ((rec.areaPhotos ?? []).length > 0) {
        sections.push({
          areaName: def.name,
          comment: rec.notes.trim() || undefined,
          photoUrls: rec.areaPhotos ?? [],
        });
      }
      for (const section of rec.activeSections) {
        const photos = rec.photosBySection[section]?.routinePhotoUrls ?? [];
        const comment = rec.itemComments?.[section]?.trim();
        const conditionTags = serializeItemMarks(rec.itemMarks?.[section]);
        if (photos.length === 0 && !comment && conditionTags.length === 0) continue;
        sections.push({
          areaName: def.name,
          itemName: section,
          comment: comment || (!sections.some((row) => row.areaName === def.name && !row.itemName)
            ? rec.notes.trim() || undefined
            : undefined),
          photoUrls: photos,
          conditionTags,
        });
      }
    }
    return sections;
  };

  const submitAll = async (finalIssues: Record<string, AreaIssue>) => {
    const sections = buildSubmission(finalIssues);
    if (sections.length === 0) {
      toast.error('Mark and photograph at least one area before submitting');
      return;
    }
    setBusy(true);
    try {
      const next = await submitTenantRoutineSelfInspection(scheduleKey, sections);
      clearRoutineSelfInspectionDraft(scheduleKey);
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
      toast.error('This area is skipped — tap next, or mark it available');
      return;
    }
    if (issue.activeSections.length === 0) {
      toast.error('Add at least one item, or skip this area');
      return;
    }
    const incomplete = firstIncompleteSection(issue.activeSections, issue.itemMarks);
    if (incomplete) {
      toast.error(`Mark Clean, Undamaged and Working for “${incomplete}”`);
      return;
    }
    const hasAreaPhotos = (issue.areaPhotos?.length ?? 0) > 0;
    const hasItemPhotos = issue.activeSections.some(
      (section) => (issue.photosBySection[section]?.routinePhotoUrls.length ?? 0) > 0,
    );
    if (!hasAreaPhotos && !hasItemPhotos) {
      toast.error('Snap at least one photo for this area');
      return;
    }

    if (isLast) {
      await submitAll({ ...issues, [area]: issue });
      return;
    }
    setAreaIndex((index) => index + 1);
  };

  const goToArea = (index: number) => {
    if (index < 0 || index >= areaCatalog.length) return;
    setAreaIndex(index);
  };

  const goBackArea = () => {
    if (safeAreaIndex > 0) {
      goToArea(safeAreaIndex - 1);
      return;
    }
    setAreaSetupComplete(false);
    setAreaIndex(0);
  };

  const resetInspection = () => {
    setResetOpen(false);
    if (persistTimer.current) clearTimeout(persistTimer.current);
    clearRoutineSelfInspectionDraft(scheduleKey);
    setAreaIndex(0);
    setIssues({});
    setCustomAreas([]);
    setSelectedAreaNames([]);
    setAreaSetupComplete(false);
    setResumingFromDraft(false);
    toast.success('Self-inspection reset — start again from area setup');
  };

  const resetControls = (
    <>
      <Button
        type="button"
        variant="outline"
        className="border-destructive/40 text-destructive hover:bg-destructive/10 w-full"
        disabled={busy || starting}
        onClick={() => setResetOpen(true)}
      >
        Reset self-inspection
      </Button>
      <ResetInspectionDialog
        open={resetOpen}
        busy={busy}
        onClose={() => setResetOpen(false)}
        onConfirm={resetInspection}
      />
    </>
  );

  const progressTone = (index: number, areaName: string) => {
    const rec = issues[areaName];
    if (index === safeAreaIndex) return 'bg-primary';
    if (rec?.available === false) return 'bg-muted-foreground/40';
    if (rec?.available === true) return 'bg-primary/70';
    if (index < safeAreaIndex) return 'bg-primary/40';
    return 'bg-secondary';
  };

  if (starting || !started || !restoredDraft) {
    return (
      <div className="flex items-center gap-2 rounded-xl border bg-card p-4 text-sm">
        <Loader2 className="size-4 animate-spin" />
        {resumingFromDraft
          ? 'Restoring your self-inspection progress…'
          : 'Preparing your self-inspection checklist…'}
      </div>
    );
  }

  if (!areaSetupComplete) {
    return (
      <div className="space-y-4">
        {resetControls}
        <InspectionAreaSetupPanel
          selectedAreaNames={resolvedSelectedAreaNames}
          customAreas={customAreas}
          existingAreaNames={ingoingExistingAreas}
          continuing={resumingFromDraft || resolvedSelectedAreaNames.length > 0}
          busy={busy || starting}
          onAddBuiltInArea={handleAddBuiltInArea}
          onAddCustomArea={handleAddCustomArea}
          onRemoveArea={handleRemoveSetupArea}
          onAddAllExisting={ingoingExistingAreas.length > 0 ? addAllFromIngoing : undefined}
          onComplete={() => {
            setAreaSetupComplete(true);
            setAreaIndex(0);
          }}
        />
      </div>
    );
  }

  if (areaCatalog.length === 0 || !areaDef) {
    return (
      <p className="text-muted-foreground text-sm">No areas selected for this self-inspection.</p>
    );
  }

  const ingoingPhotosBySection = Object.fromEntries(
    issue.activeSections.map((section) => [
      section,
      matchReferenceSectionPhotos(area, section, referenceIngoingAreas),
    ]),
  );

  return (
    <div className="space-y-4">
      {resetControls}
      <p className="text-muted-foreground text-xs">
        Each room opens with its items ready. Hold Yes / No on Clean, Undamaged or
        Working to mark every item in the room. Photograph exceptions beside the
        latest ingoing baseline.
      </p>

      <InspectionAreaNav
        areaCatalog={areaCatalog}
        areaIndex={safeAreaIndex}
        progressTone={progressTone}
        onGoToArea={goToArea}
      />

      {issue.available === false ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {area} — skipped ({safeAreaIndex + 1}/{areaCatalog.length})
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
              <Button type="button" variant="outline" className="flex-1" onClick={goBackArea}>
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
                  {busy ? 'Submitting…' : 'Complete inspection'}
                </Button>
              ) : (
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => goToArea(safeAreaIndex + 1)}
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
              {area} ({safeAreaIndex + 1}/{areaCatalog.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RoutinePhotoColumn
              title="Area photos"
              photoUrls={issue.areaPhotos ?? []}
              uploading={busy}
              disabled={busy}
              onPhotosChange={(urls) => updateIssue({ areaPhotos: urls })}
            />

            <RoutineSectionItems
              definition={areaDef}
              activeSections={issue.activeSections}
              photosBySection={issue.photosBySection}
              itemMarks={issue.itemMarks}
              itemComments={issue.itemComments}
              ingoingPhotosBySection={ingoingPhotosBySection}
              busy={busy}
              onAddSection={addSection}
              onRemoveSection={removeSection}
              onRenameSection={renameSection}
              onMoveSection={moveSection}
              onChangeMarks={changeMarks}
              onFillColumn={fillColumn}
              onChangeComment={changeItemComment}
              onRoutinePhotosChange={(section, urls) => {
                updateIssue((current) => {
                  const existing = current.photosBySection[section] ?? emptySectionPhotos();
                  return {
                    photosBySection: {
                      ...current.photosBySection,
                      [section]: { ...existing, routinePhotoUrls: urls },
                    },
                  };
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
                disabled={busy}
                onClick={goBackArea}
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
                {busy ? <Loader2 className="size-4 animate-spin" /> : isLast ? 'Complete inspection' : 'Next area'}
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground w-full"
              disabled={busy}
              onClick={() => markAvailable(false)}
            >
              Skip this area instead
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
