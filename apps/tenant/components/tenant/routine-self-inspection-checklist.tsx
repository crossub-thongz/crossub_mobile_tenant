'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { MaintenanceMediaUploadField } from '@/components/maintenance/maintenance-media-upload-field';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { TenantRoutineInspection } from '@/lib/crossub-api/tenant-account-client';
import {
  startTenantRoutineSelfInspection,
  submitTenantRoutineSelfInspection,
} from '@/lib/crossub-api/tenant-account-client';

type ChecklistSection = {
  id: string;
  room: string;
  description: string;
};

type SectionDraft = {
  comment: string;
  photoUrls: string[];
};

export function RoutineSelfInspectionChecklist({
  inspection,
  onUpdated,
}: {
  inspection: TenantRoutineInspection;
  onUpdated: (next: TenantRoutineInspection) => void;
}) {
  const sections = useMemo<ChecklistSection[]>(
    () =>
      (inspection.sections ?? []).map((section) => ({
        id: section.id,
        room: section.room,
        description: section.description,
      })),
    [inspection.sections],
  );

  const initialDrafts = useMemo(() => {
    if (inspection.previousSubmission) return {};
    const placeholder = 'Upload photos and note the current condition.';
    const submitted = 'Tenant self-inspection submitted.';
    const next: Record<string, SectionDraft> = {};
    for (const section of inspection.sections ?? []) {
      if (section.photos?.length || section.description) {
        const comment =
          section.description &&
          section.description !== placeholder &&
          section.description !== submitted
            ? section.description
            : '';
        next[section.id] = {
          comment,
          photoUrls: section.photos ?? [],
        };
      }
    }
    return next;
  }, [inspection.previousSubmission, inspection.sections]);

  const [drafts, setDrafts] = useState<Record<string, SectionDraft>>(initialDrafts);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [started, setStarted] = useState(
    sections.every((section) => !section.id.startsWith('template-')),
  );

  useEffect(() => {
    setDrafts((prev) => ({ ...initialDrafts, ...prev }));
  }, [initialDrafts]);

  useEffect(() => {
    if (sections.every((section) => !section.id.startsWith('template-'))) {
      setStarted(true);
    }
  }, [sections]);

  const scheduleKey = inspection.scheduleId ?? inspection.id;

  const getDraft = (sectionId: string): SectionDraft =>
    drafts[sectionId] ?? { comment: '', photoUrls: [] };

  const updateDraft = (sectionId: string, patch: Partial<SectionDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [sectionId]: { ...getDraft(sectionId), ...patch },
    }));
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      const next = await startTenantRoutineSelfInspection(scheduleKey);
      onUpdated(next);
      setStarted(true);
      toast.success('Self-inspection started');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start self-inspection');
    } finally {
      setStarting(false);
    }
  };

  const handleSubmit = async () => {
    const payloadSections = sections.map((section) => {
      const draft = getDraft(section.id);
      return {
        areaId: section.id,
        comment: draft.comment.trim() || undefined,
        photoUrls: draft.photoUrls,
      };
    });

    const incomplete = payloadSections.filter(
      (section) => !section.comment && section.photoUrls.length === 0,
    );
    if (incomplete.length > 0) {
      toast.error('Add a note or photo for every room before submitting');
      return;
    }

    setSubmitting(true);
    try {
      const next = await submitTenantRoutineSelfInspection(scheduleKey, payloadSections);
      onUpdated(next);
      toast.success('Self-inspection submitted — your property manager will review it');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not submit self-inspection');
    } finally {
      setSubmitting(false);
    }
  };

  if (sections.length === 0) {
    return (
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
        <p className="font-medium">Self-inspection checklist loading</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Tap start to prepare your room-by-room checklist.
        </p>
        <Button
          type="button"
          className="mt-3"
          disabled={starting}
          onClick={() => void handleStart()}
        >
          {starting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Start self-inspection
        </Button>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
        <p className="font-medium">Ready to begin</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Walk through {sections.length} areas and upload current condition evidence for each
          room.
        </p>
        <Button
          type="button"
          className="mt-3"
          disabled={starting}
          onClick={() => void handleStart()}
        >
          {starting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Start self-inspection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {inspection.previousSubmission ? (
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 text-sm">
          <p className="font-medium">Revised self-inspection</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Upload new photos and notes for each area, then submit for review again.
          </p>
        </div>
      ) : null}
      {sections.map((section) => {
        const draft = getDraft(section.id);
        return (
          <section key={section.id} className="rounded-xl border bg-card p-4">
            <p className="font-semibold">{section.room}</p>
            <p className="text-muted-foreground mt-1 text-sm">{section.description}</p>
            <div className="mt-3 space-y-3">
              <Textarea
                value={draft.comment}
                onChange={(event) =>
                  updateDraft(section.id, { comment: event.target.value })
                }
                placeholder="Note the current condition (required if no photos)"
                rows={3}
              />
              <MaintenanceMediaUploadField
                photos={draft.photoUrls}
                onPhotosChange={(photoUrls) => updateDraft(section.id, { photoUrls })}
                disabled={submitting}
              />
            </div>
          </section>
        );
      })}

      <Button
        type="button"
        className="w-full"
        disabled={submitting}
        onClick={() => void handleSubmit()}
      >
        {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        Submit self-inspection
      </Button>
    </div>
  );
}
