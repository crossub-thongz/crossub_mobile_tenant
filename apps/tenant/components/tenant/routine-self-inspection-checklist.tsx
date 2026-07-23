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
  referencePhotos: string[];
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
        referencePhotos: section.referencePhotos ?? [],
      })),
    [inspection.sections],
  );

  const [drafts, setDrafts] = useState<Record<string, SectionDraft>>({});
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [started, setStarted] = useState(
    sections.every((section) => !section.id.startsWith('template-')),
  );

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
          Walk through {sections.length} areas, compare with your ingoing photos, and upload
          current condition evidence.
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
      {sections.map((section) => {
        const draft = getDraft(section.id);
        return (
          <section key={section.id} className="rounded-xl border bg-card p-4">
            <p className="font-semibold">{section.room}</p>
            <p className="text-muted-foreground mt-1 text-sm">{section.description}</p>
            {section.referencePhotos.length > 0 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {section.referencePhotos.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-secondary block size-16 shrink-0 overflow-hidden rounded-lg border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="size-full object-cover" />
                  </a>
                ))}
              </div>
            ) : null}
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
