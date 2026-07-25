'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { AreaAvailablePrompt } from '@/components/tenant/area-available-prompt';
import { InspectionAreaNav } from '@/components/tenant/inspection-area-nav';
import { InspectionAreaSetupPanel } from '@/components/tenant/inspection-area-setup-panel';
import { ResetInspectionDialog } from '@/components/tenant/reset-inspection-dialog';
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
  clearRoutineSelfInspectionDraft,
  loadRoutineSelfInspectionDraft,
  persistRoutineSelfInspectionDraft,
} from '@/lib/routine-self-inspection-draft';
import {
  existingAreaNamesFromPlan,
  findIngoingPlanRoom,
  resolveIngoingAreaPlan,
  sectionsForAvailableArea,
  type IngoingAreaPlan,
} from '@/lib/inspection-area-workflow';

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

  useEffect(() => {
    const referenceIngoingAreas = (
      inspection as {
        referenceIngoingAreas?: Array<{ name: string; photos: string[] }>;
      }
    ).referenceIngoingAreas;
    const refAreas =
      referenceIngoingAreas?.map((area) => ({
        name: area.name,
        photos: area.photos.map((url: string) => ({ url })),
      })) ?? [];
    setIngoingAreaPlan(resolveIngoingAreaPlan(refAreas));
  }, [inspection]);

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
    const names = ingoingExistingAreas.filter(
      (name) =>
        !resolvedSelectedAreaNames.some(
          (selected) => selected.toLowerCase() === name.toLowerCase(),
        ),
    );
    if (names.length === 0) return;
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
      if (!isLast) setAreaIndex(safeAreaIndex + 1);
      return;
    }

    const sections = sectionsForAvailableArea(area, customAreas, ingoingAreaPlan);
    const photosBySection: Record<string, SectionPhotos> = {
      ...(issue.photosBySection ?? {}),
    };
    for (const section of sections) {
      if (!photosBySection[section]) {
        photosBySection[section] = { routinePhotoUrls: [] };
      }
    }
    updateIssue({
      available: true,
      activeSections: sections,
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
    const planSections = findIngoingPlanRoom(ingoingAreaPlan, area)?.sections ?? [];
    if (planSections.includes(section)) return;
    if (areaDef?.defaultSections.includes(section)) return;
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
    for (const def of areaCatalog) {
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

  if (areaCatalog.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No areas selected for this self-inspection.</p>
    );
  }

  return (
    <div className="space-y-4">
      {resetControls}
      <p className="text-muted-foreground text-xs">
        Walk through each area and upload current condition photos for each section.
      </p>

      <InspectionAreaNav
        areaCatalog={areaCatalog}
        areaIndex={safeAreaIndex}
        progressTone={progressTone}
        onGoToArea={goToArea}
      />

      {issue.available == null ? (
        <AreaAvailablePrompt
          areaName={area}
          areaIndex={safeAreaIndex}
          totalAreas={areaCatalog.length}
          onYes={() => markAvailable(true)}
          onNo={() => markAvailable(false)}
        />
      ) : issue.available === false ? (
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
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={goBackArea}
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
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : isLast ? (
                  'Complete inspection'
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
