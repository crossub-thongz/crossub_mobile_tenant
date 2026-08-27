'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { DraggableNamedList } from '@/components/tenant/draggable-named-list';
import { InspectionAreaNav, inspectionAreaProgressBarClass } from '@/components/tenant/inspection-area-nav';
import { RenameLabelDialog } from '@/components/tenant/rename-label-dialog';
import { ResetInspectionDialog } from '@/components/tenant/reset-inspection-dialog';
import { TenantAreaPhotosField } from '@/components/tenant/tenant-area-photos-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { InspectionAreaDefinition } from '@/constants/inspection-areas';
import type { TenantRoutineInspection } from '@/lib/crossub-api/tenant-account-client';
import {
  saveTenantRoutineSelfInspectionDraft,
  startTenantRoutineSelfInspection,
  submitTenantRoutineSelfInspection,
} from '@/lib/crossub-api/tenant-account-client';
import { moveIndex, validateUniqueLabel } from '@/lib/inspection-layout-edit';
import { matchAllReferencePhotosForRoom } from '@/lib/outgoing-reference-photos';
import {
  clearRoutineSelfInspectionDraft,
  emptyRoutineSelfAreaDraft,
  isRoutineSelfAreaComplete,
  loadRoutineSelfInspectionDraft,
  mergeRoutineSelfInspectionDrafts,
  persistRoutineSelfInspectionDraft,
  resolveWalkOrder,
  serverDraftToLocal,
  toServerDraftPayload,
  type RoutineSelfAreaDraft,
  type ServerRoutineSelfDraft,
} from '@/lib/routine-self-inspection-draft';
import { tenantSelfRoutineAreasFromBedrooms } from '@/lib/tenant-self-routine-layout';
import { cn } from '@/lib/utils';

function areaCatalogFromNames(names: string[]): InspectionAreaDefinition[] {
  return names.map((name) => ({
    name,
    defaultSections: [],
    optionalSections: [],
  }));
}

function draftFromInspection(
  scheduleKey: string,
  inspection: TenantRoutineInspection,
): ReturnType<typeof serverDraftToLocal> | null {
  const selfDraft = (inspection as { selfDraft?: ServerRoutineSelfDraft }).selfDraft;
  const fromMeta = selfDraft?.areas?.length
    ? serverDraftToLocal(scheduleKey, selfDraft)
    : null;
  const fromSections: Record<string, RoutineSelfAreaDraft> = {};
  for (const section of inspection.sections ?? []) {
    const name = section.room.trim();
    const photoUrls = (section.photos ?? []).filter((url) =>
      /^https?:\/\//i.test(url),
    );
    if (!name || photoUrls.length === 0) continue;
    fromSections[name] = {
      skipped: false,
      notes: '',
      photoUrls,
      maintenanceRequest: null,
    };
  }
  const fromAreas =
    Object.keys(fromSections).length > 0
      ? {
          scheduleKey,
          areaIndex: 0,
          areas: fromSections,
          started: true as const,
        }
      : null;
  return mergeRoutineSelfInspectionDrafts(scheduleKey, fromMeta, fromAreas);
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
  const [areaOrder, setAreaOrder] = useState<string[]>([]);
  const [areas, setAreas] = useState<Record<string, RoutineSelfAreaDraft>>({});
  const [addAreaOpen, setAddAreaOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serverPersistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveGeneration = useRef(0);
  const areasRef = useRef(areas);
  const areaIndexRef = useRef(areaIndex);
  const areaOrderRef = useRef(areaOrder);
  const sourceAreaNamesRef = useRef<string[]>([]);
  areasRef.current = areas;
  areaIndexRef.current = areaIndex;
  areaOrderRef.current = areaOrder;

  const referenceIngoingAreas = useMemo(
    () =>
      (
        inspection as {
          referenceIngoingAreas?: Array<{ name: string; photos: string[] }>;
        }
      ).referenceIngoingAreas ?? [],
    [inspection],
  );

  const sourceAreaNames = useMemo(
    () =>
      tenantSelfRoutineAreasFromBedrooms(
        (inspection as { bedrooms?: number | null }).bedrooms,
      ),
    [inspection],
  );

  const areaNames = useMemo(
    () => resolveWalkOrder(areaOrder, sourceAreaNames),
    [areaOrder, sourceAreaNames],
  );

  const areaCatalog = useMemo(() => areaCatalogFromNames(areaNames), [areaNames]);
  sourceAreaNamesRef.current = sourceAreaNames;

  const buildLocalDraft = (
    nextAreas = areasRef.current,
    nextIndex = areaIndexRef.current,
    nextOrder = areaOrderRef.current,
  ) => {
    const resolvedOrder = resolveWalkOrder(nextOrder, sourceAreaNamesRef.current);
    return {
      scheduleKey,
      areaIndex: nextIndex,
      areaOrder: resolvedOrder,
      areas: nextAreas,
      started: true as const,
    };
  };

  const hasDraftProgress = (nextAreas: Record<string, RoutineSelfAreaDraft>, nextOrder: string[]) => {
    const resolvedOrder = resolveWalkOrder(nextOrder, sourceAreaNamesRef.current);
    const orderChanged = resolvedOrder.join('\0') !== sourceAreaNamesRef.current.join('\0');
    return (
      orderChanged ||
      Object.values(nextAreas).some(
        (area) =>
          area.skipped ||
          area.photoUrls.length > 0 ||
          area.notes.trim() ||
          area.maintenanceRequest != null,
      )
    );
  };

  const flushLocalDraft = (
    nextAreas = areasRef.current,
    nextIndex = areaIndexRef.current,
    nextOrder = areaOrderRef.current,
  ) => {
    if (!hasDraftProgress(nextAreas, nextOrder)) {
      clearRoutineSelfInspectionDraft(scheduleKey);
      return null;
    }
    const draft = buildLocalDraft(nextAreas, nextIndex, nextOrder);
    persistRoutineSelfInspectionDraft(draft);
    return draft;
  };

  const flushServerDraft = (
    draft = flushLocalDraft(),
    options?: { allowEmpty?: boolean },
  ) => {
    if (!draft && !options?.allowEmpty) return;
    const generation = saveGeneration.current;
    const payload = draft
      ? toServerDraftPayload(draft)
      : {
          areaIndex: 0,
          areaOrder: sourceAreaNamesRef.current,
          areas: sourceAreaNamesRef.current.map((areaName) => ({
            areaName,
            skipped: false,
            notes: '',
            photoUrls: [] as string[],
          })),
        };
    if (!payload.areas.length && !draft) return;
    void saveTenantRoutineSelfInspectionDraft(scheduleKey, payload)
      .catch(() => {
        // Offline — local copy still has hosted photo URLs for this device.
      })
      .finally(() => {
        if (generation === saveGeneration.current) return;
        const latest = flushLocalDraft();
        flushServerDraft(latest, { allowEmpty: !latest });
      });
  };

  useEffect(() => {
    const saved = loadRoutineSelfInspectionDraft(scheduleKey);
    if (!saved) {
      setRestoredDraft(true);
      return;
    }
    setResumingFromDraft(true);
    setAreaIndex(saved.areaIndex);
    setAreaOrder(saved.areaOrder ?? []);
    setAreas(saved.areas);
    setStarted(saved.started);
    setRestoredDraft(true);
  }, [scheduleKey]);

  useEffect(() => {
    if (!started || !restoredDraft) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      flushLocalDraft();
    }, 200);
    if (serverPersistTimer.current) clearTimeout(serverPersistTimer.current);
    serverPersistTimer.current = setTimeout(() => {
      flushServerDraft();
    }, 600);
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
      if (serverPersistTimer.current) clearTimeout(serverPersistTimer.current);
    };
  }, [started, restoredDraft, scheduleKey, areaIndex, areaOrder, sourceAreaNames, areas]);

  useEffect(() => {
    const flush = () => flushServerDraft();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    window.addEventListener('online', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('online', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [scheduleKey]);

  useEffect(() => {
    if (!restoredDraft) return;
    let cancelled = false;
    void (async () => {
      setStarting(true);
      try {
        const next = await startTenantRoutineSelfInspection(scheduleKey);
        if (cancelled) return;
        onUpdated(next);
        const merged = mergeRoutineSelfInspectionDrafts(
          scheduleKey,
          loadRoutineSelfInspectionDraft(scheduleKey),
          draftFromInspection(scheduleKey, next),
        );
        if (merged) {
          setAreaIndex(merged.areaIndex);
          setAreaOrder(merged.areaOrder ?? []);
          setAreas(merged.areas);
          persistRoutineSelfInspectionDraft(merged);
          setResumingFromDraft(true);
        }
        setStarted(true);
      } catch (err) {
        if (!cancelled) {
          const local = loadRoutineSelfInspectionDraft(scheduleKey);
          if (local?.started) {
            setStarted(true);
          }
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
          maintenanceRequest: row.maintenanceRequest ?? undefined,
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
    if (!rec.skipped && rec.maintenanceRequest == null) {
      toast.error('Select whether this area needs a maintenance request');
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

  const handleMoveArea = (from: number, to: number) => {
    const currentName = areaNames[safeAreaIndex];
    const next = moveIndex(areaNames, from, to);
    setAreaOrder(next);
    const nextIndex = currentName ? next.indexOf(currentName) : to;
    setAreaIndex(nextIndex >= 0 ? nextIndex : 0);
  };

  const handleAddArea = (rawName: string) => {
    const name = rawName.trim().replace(/\s+/g, ' ');
    const error = validateUniqueLabel(name, areaNames);
    if (error) return error;
    const next = [...areaNames, name];
    setAreaOrder(next);
    setAreas((prev) => ({ ...prev, [name]: emptyRoutineSelfAreaDraft() }));
    setAreaIndex(next.length - 1);
    return null;
  };

  const handleDeleteArea = (name: string) => {
    if (areaNames.length <= 1) {
      toast.error('Keep at least one area');
      return;
    }
    const next = areaNames.filter((item) => item !== name);
    setAreaOrder(next);
    setAreas((prev) => {
      const { [name]: _removed, ...rest } = prev;
      return rest;
    });
    setAreaIndex((index) => Math.min(index, next.length - 1));
  };

  const resetInspection = () => {
    setResetOpen(false);
    if (persistTimer.current) clearTimeout(persistTimer.current);
    if (serverPersistTimer.current) clearTimeout(serverPersistTimer.current);
    saveGeneration.current += 1;
    clearRoutineSelfInspectionDraft(scheduleKey);
    setAreaIndex(0);
    setAreaOrder([]);
    setAreas({});
    setResumingFromDraft(false);
    flushServerDraft(null, { allowEmpty: true });
    toast.success('Self-inspection reset — start again from the first area');
  };

  const progressTone = (index: number, areaName: string) =>
    inspectionAreaProgressBarClass(
      index === safeAreaIndex,
      isRoutineSelfAreaComplete(areas[areaName]),
    );

  const areaStatusLabel = (index: number, name: string) => {
    if (index === safeAreaIndex) return 'Current area';
    const row = areas[name];
    if (row?.skipped) return 'Skipped';
    if (isRoutineSelfAreaComplete(row)) return 'Completed';
    return 'Not photographed';
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
        No areas to inspect. Add an area to continue.
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
        Rooms start from this property’s bedroom layout. Add or remove areas, drag
        to reorder, then photograph each room overall as it is now — not walls,
        windows, or other parts. You can snap or upload several photos per room.
      </p>

      <ul className="space-y-2">
        <DraggableNamedList
          items={areaNames}
          disabled={busy}
          onReorder={handleMoveArea}
          itemClassName={(name) =>
            isRoutineSelfAreaComplete(areas[name])
              ? 'rounded-lg border border-primary/40 bg-primary/20 px-2'
              : 'rounded-lg border bg-card px-2'
          }
          renderItem={(name, index) => {
            const complete = isRoutineSelfAreaComplete(areas[name]);
            return (
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <button
                  type="button"
                  className="min-w-0 flex-1 py-1 text-left"
                  onClick={() => goToArea(index)}
                >
                  <p className="flex items-center gap-1.5 font-medium">
                    {complete ? (
                      <CheckCircle2
                        className="text-primary size-4 shrink-0"
                        aria-hidden
                      />
                    ) : null}
                    {name}
                  </p>
                  <p
                    className={cn(
                      'text-xs',
                      complete ? 'text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {areaStatusLabel(index, name)}
                  </p>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive size-8 shrink-0"
                  disabled={busy || areaNames.length <= 1}
                  aria-label={`Remove ${name}`}
                  onClick={() => handleDeleteArea(name)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            );
          }}
        />
      </ul>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={busy}
        onClick={() => setAddAreaOpen(true)}
      >
        <Plus className="size-4" />
        Add area
      </Button>
      <RenameLabelDialog
        open={addAreaOpen}
        title="Add area"
        description="Name the extra room or space you want to photograph."
        label="Area name"
        initialValue=""
        confirmLabel="Add"
        onClose={() => setAddAreaOpen(false)}
        onConfirm={handleAddArea}
      />

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
            {/*
              CRS-0137 — the move-in comparison renders only when there is something to
              compare. It used to render unconditionally, headed "Ingoing" and reading "No
              ingoing photos for this area.", so the first thing a tenant met on every room of
              a routine walk was an empty ingoing condition report. That is what "click into
              self routine inspection, it shows ingoing inspection" was.

              It is never filled in production: of 401 completed/published INGOING inspections
              not one has a single InspectionArea row (probe 27 Aug 2026,
              `probe:tenant-self-routine-content --prod` in crossub_web), and the API drops
              every reference area with no photo before it sends `referenceIngoingAreas` — a
              migrated ingoing report is a PDF and nothing else. So the block was empty for
              every tenant, on every room, always.

              The label reads "At move-in", not "Ingoing": the tenant is being asked to
              photograph the room as it is now, and naming another inspection type inside that
              walk is what made this read as the wrong screen.
            */}
            {ingoingPhotos.length > 0 ? (
              <TenantAreaPhotosField
                label="At move-in"
                photoUrls={ingoingPhotos}
                disabled
              />
            ) : null}
            <TenantAreaPhotosField
              // "Now" is only meaningful opposite the move-in photos above it; with nothing to
              // compare against, the tenant is simply photographing the room.
              label={ingoingPhotos.length > 0 ? 'Now' : 'Photos'}
              photoUrls={rec.photoUrls}
              uploading={busy}
              sessionKey={area}
              emptyLabel={`Add at least one overall photo of ${area} — not walls, windows, or other parts.`}
              onPhotosChange={(updater) =>
                updateArea((current) => ({ photoUrls: updater(current.photoUrls) }))
              }
            />

            <div className="space-y-1.5">
              <p className="text-sm font-medium">Any maintenance request?</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={rec.maintenanceRequest === true ? 'default' : 'outline'}
                  onClick={() => updateArea({ maintenanceRequest: true })}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  variant={rec.maintenanceRequest === false ? 'default' : 'outline'}
                  onClick={() => updateArea({ maintenanceRequest: false })}
                >
                  No
                </Button>
              </div>
              {rec.maintenanceRequest === true ? (
                <p className="text-muted-foreground text-xs">
                  Note what needs attention below. Your property manager will see this
                  with the report.
                </p>
              ) : null}
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
