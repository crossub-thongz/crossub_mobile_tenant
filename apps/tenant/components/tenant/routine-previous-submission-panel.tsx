'use client';

import { useState } from 'react';
import { ChevronDown, FileText } from 'lucide-react';

import { ReportSectionCard } from '@/components/tenant/report-section-card';
import { cn } from '@/lib/utils';
import type { ReportSection } from '@/lib/types';

export type RoutinePreviousSubmission = {
  submittedAt: string;
  reportUrl: string | null;
  sections: Array<{
    id: string;
    room: string;
    description: string;
    photos?: string[];
  }>;
};

export function RoutinePreviousSubmissionPanel({
  submission,
  declineReason,
  className,
}: {
  submission: RoutinePreviousSubmission;
  declineReason?: string | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const sections: ReportSection[] = submission.sections.map((section) => ({
    id: section.id,
    room: section.room,
    description: section.description,
    photos: section.photos ?? [],
    referencePhotos: [],
    tenantConfirmed: false,
  }));

  return (
    <div className={cn('mb-4 rounded-xl border bg-muted/20', className)}>
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <FileText className="text-muted-foreground size-4 shrink-0" />
            <p className="text-sm font-medium">Your first submission</p>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Kept for reference after changes were requested
          </p>
        </div>
        <ChevronDown
          className={cn(
            'text-muted-foreground mt-0.5 size-4 shrink-0 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
      {open ? (
        <div className="space-y-3 border-t px-4 py-3">
          {declineReason ? (
            <p className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs">
              {declineReason}
            </p>
          ) : null}
          {sections.map((section) => (
            <ReportSectionCard
              key={section.id}
              section={section}
              currentPhotoLabel="Submitted"
              readOnly
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
