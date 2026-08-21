'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { InspectionAreaNav } from '@/components/tenant/inspection-area-nav';
import { ResetInspectionDialog } from '@/components/tenant/reset-inspection-dialog';
import { RoutinePhotoColumn } from '@/components/tenant/routine-photo-column';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { InspectionAreaDefinition } from '@/constants/inspection-areas';
import type { TenantRoutineInspection } from '@/lib/crossub-api/tenant-account-client';
import {
  startTenantRoutineSelfInspection,
  submitTenantRoutineSelfInspection,
} from '@/lib/crossub-api/tenant-account-client';
import {
  existingAreaNamesFromPlan,
  resolveIngoingAreaPlan,
} from '@/lib/inspection-area-workflow';
import { matchAllReferencePhotosForRoom } from '@/lib/outgoing-reference-photos';
import {
  clearRoutineSelfInspectionDraft,
  emptyRoutineSelfAreaDraft,
  loadRoutineSelfInspectionDraft,
  persistRoutineSelfInspectionDraft,
  type RoutineSelfAreaDraft,
} from '@/lib/routine-self-inspection-draft';

const FALLBACK_AREAS = ['Kitchen', 'Bathroom', 'Bedroom', 'Lounge', 'Laundry'];

function areaCatalogFromNames(names: string[]): InspectionAreaDefinition[] {
  return names.map((name) => ({
    name,
    defaultSections: [],
    optionalSections: [],
  }));
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
  const [areas, setAreas] = useState<Record<string, RoutineSelfAreaDraft>>({});
  const [resetOpen, setResetOpen] = useState(false);
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

  const areaNames = useMemo(() => {
    const plan = resolveIngoingAreaPlan(
      referenceIngoingAreas.map((area) => ({ name: area.name })),
    );
    const fromIngoing = existingAreaNamesFromPlan(plan);
    if (fromIngoing.length > 0) return fromIngoing;
    const fromSections = (inspection.sections ?? [])
      .map((section) => section.room.trim())
      .filter(Boolean);
    const unique = [...new Set(fromSections)];
    return unique.length > 0 ? unique : FALLBACK_AREAS;
  }, [inspection.sections, referenceIngoingAreas]);

  const areaCatalog = useMemo(() => areaCatalogFromNames(areaNames), [areaNames]);

  useEffect(() => {
    const saved = loadRoutineSelfInspectionDraft(scheduleKey);
    if (!saved) {
      setRestoredDraft(true);
      return;
    }
    setResumingFromDraft(true);
    setAreaIndex(saved.areaIndex);
    setAreas(saved.areas);
    setStarted(saved.started);
    setRestoredDraft(true);
  }, [scheduleKey]);

  useEffect(() => {
    if (!started || !restoredDraft) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      const hasProgress = Object.values(areas).some(
        (area) => area.skipped || area.photoUrls.length > 0 || area.notes.trim(),
      );
      if (!hasProgress) {
        clearRoutineSelfInspectionDraft(scheduleKey);
        return;
      }
      persistRoutineSelfInspectionDraft({
        scheduleKey,
        areaIndex,
        areas,
        started: true,
      });
    }, 350);
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [started, restoredDraft, scheduleKey, areaIndex, areas]);

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

  const safeAreaIndex = Math.min(
    Math.max(areaIndex, 0),
    Math.max(areaCatalog.length - 1, 0),
  );
  const areaDef = areaCatalog[safeAreaIndex];
  const area = areaDef?.name ?? areaCatalog[0]?.name ?? 'Area';
  const rec = areas[area] ?? emptyRoutineSelfAreaDraft();
  const isLast = safeAreaIndex === areaCatalog.length - 1;
  const ingoingPhotos = matchAllReferencePhotosForRoom(area, referenceIngoingAreas);

  const updateArea = (
    patch: Partial<RoutineSelfAreaDraft> | ((current: RoutineSelfAreaDraft) => Partial<RoutineSelfAreaDraft>),
  ) => {
    setAreas((prev) => {
      const current = prev[area] ?? emptyRoutineSelfAreaDraft();
      return {
        ...prev,
        [area]: {
          ...current,
          ...(typeof patch === 'function' ? patch(current) : patch),
        },
      };
    });
  };

  const buildSubmission = (finalAreas: Record<string, RoutineSelfAreaDraft>) => {
    return areaCatalog.flatMap((def) => {
      const row = finalAreas[def.name] ?? emptyRoutineSelfAreaDraft();
      if (row.skipped || row.photoUrls.length === 0) return [];
      return [
        {
          areaName: def.name,
          comment: row.notes.trim() || undefined,
          photoUrls: row.photoUrls,
        },
      ];
    });
  };

  const submitAll = async (finalAreas: Record<string, RoutineSelfAreaDraft>) => {
    const sections = buildSubmission(finalAreas);
    if (sections.length === 0) {
      toast.error('Photograph at least one area before submitting');
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
    if (!rec.skipped && rec.photoUrls.length === 0) {
      toast.error(`Add at least one photo of ${area}`);
      return;
    }
    if (isLast) {
      await submitAll({ ...areas, [area]: rec });
      return;
    }
    setAreaIndex((index) => index + 1);
  };

  const goToArea = (index: number) => {
    if (index < 0 || index >= areaCatalog.length) return;
    setAreaIndex(index);
  };

  const resetInspection = () => {
    setResetOpen(false);
    if (persistTimer.current) clearTimeout(persistTimer.current);
    clearRoutineSelfInspectionDraft(scheduleKey);
    setAreaIndex(0);
    setAreas({});
    setResumingFromDraft(false);
    toast.success('Self-inspection reset — start again from the first area');
  };

  const progressTone = (index: number, areaName: string) => {
    const row = areas[areaName];
    if (index === safeAreaIndex) return 'bg-primary';
    if (row?.skipped) return 'bg-muted-foreground/40';
    if ((row?.photoUrls.length ?? 0) > 0) return 'bg-primary/70';
    if (index < safeAreaIndex) return 'bg-primary/40';
    return 'bg-secondary';
  };

  if (starting || !started || !restoredDraft) {
    return (
      <div className="flex items-center gap-2 rounded-xl border bg-card p-4 text-sm">
        <Loader2 className="size-4 animate-spin" />
        {resumingFromDraft
          ? 'Restoring your self-inspection progress…'
          : 'Preparing your self-inspection…'}
      </div>
    );
  }

  if (areaCatalog.length === 0 || !areaDef) {
    return (
      <p className="text-muted-foreground text-sm">
        No areas were found from the last ingoing inspection.
      </p>
    );
  }

  return (
    <div className="space-y-4">
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

      <p className="text-muted-foreground text-xs">
        Rooms come from the last ingoing inspection. Photograph each area as it is
        now — you do not need to add rooms or tick sections.
      </p>

      <InspectionAreaNav
        areaCatalog={areaCatalog}
        areaIndex={safeAreaIndex}
        progressTone={progressTone}
        onGoToArea={goToArea}
      />

      {rec.skipped ? (
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
              onClick={() => updateArea({ skipped: false })}
            >
              Photograph this area
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => goToArea(safeAreaIndex - 1)}
                disabled={safeAreaIndex === 0}
              >
                <ChevronLeft className="size-4" />
                Back
              </Button>
              {isLast ? (
                <Button
                  type="button"
                  className="flex-1"
                  disabled={busy}
                  onClick={() => void submitAll(areas)}
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
            <div className="grid grid-cols-2 gap-3">
              <RoutinePhotoColumn
                title="Ingoing"
                photoUrls={ingoingPhotos}
                disabled
              />
              <RoutinePhotoColumn
                title="Now"
                photoUrls={rec.photoUrls}
                uploading={busy}
                disabled={busy}
                onPhotosChange={(urls) => updateArea({ photoUrls: urls })}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor={`notes-${area}`} className="text-sm font-medium">
                Notes (optional)
              </label>
              <Input
                id={`notes-${area}`}
                value={rec.notes}
                placeholder="Note anything unusual in this area"
                onChange={(event) => updateArea({ notes: event.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={busy || safeAreaIndex === 0}
                onClick={() => goToArea(safeAreaIndex - 1)}
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

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground w-full"
              disabled={busy}
              onClick={() => {
                updateArea({ skipped: true, photoUrls: [] });
                if (!isLast) setAreaIndex(safeAreaIndex + 1);
              }}
            >
              Skip this area
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
