'use client';

import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { stripEmojis } from '@/lib/strip-emojis';
import type { ReportSection } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

function PhotoRow({ urls, label }: { urls: string[]; label: string }) {
  if (urls.length === 0) {
    return (
      <p className="text-muted-foreground flex items-center gap-1 text-xs">
        <ImageIcon className="size-3" /> No {label.toLowerCase()} photos
      </p>
    );
  }
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
        {label}
      </p>
      <div className="flex gap-2 overflow-x-auto">
        {urls.map((src) => (
          <a
            key={src}
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-secondary block size-16 shrink-0 overflow-hidden rounded-lg border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="size-full object-cover" />
          </a>
        ))}
      </div>
    </div>
  );
}

export function ReportSectionCard({
  section,
  disabled,
  onConfirm,
  onDispute,
  currentPhotoLabel = 'Current',
  readOnly = false,
}: {
  section: ReportSection;
  disabled?: boolean;
  onConfirm?: (feedback?: string) => void;
  onDispute?: (comment: string) => void;
  currentPhotoLabel?: string;
  readOnly?: boolean;
}) {
  const [feedbackText, setFeedbackText] = useState(
    section.tenantFeedback ?? section.tenantDispute ?? '',
  );
  const done = section.tenantConfirmed || !!section.tenantDispute;
  const referencePhotos = section.referencePhotos ?? [];
  const hasReference = referencePhotos.length > 0;

  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="font-semibold">{section.room}</p>
      <p className="text-muted-foreground mt-1 text-sm">{section.description}</p>

      {hasReference ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <PhotoRow urls={referencePhotos} label="Ingoing" />
          <PhotoRow urls={section.photos} label={currentPhotoLabel} />
        </div>
      ) : section.photos.length > 0 ? (
        <div className="mt-3">
          <PhotoRow urls={section.photos} label="Photos" />
        </div>
      ) : (
        <p className="text-muted-foreground mt-2 flex items-center gap-1 text-xs">
          <ImageIcon className="size-3" /> No section photos uploaded
        </p>
      )}

      {section.tenantConfirmed && section.confirmedAt ? (
        <p className="text-primary mt-2 text-xs">
          Confirmed {formatDateTime(section.confirmedAt)}
          {section.tenantFeedback ? ` — “${section.tenantFeedback}”` : ''}
        </p>
      ) : null}
      {section.tenantDispute ? (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          Dispute: {section.tenantDispute}
        </p>
      ) : null}
      {!readOnly && !done && !disabled && onConfirm && onDispute ? (
        <div className="mt-3 space-y-2">
          <textarea
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Optional feedback on this section (required if you dispute)"
            value={feedbackText}
            onChange={(e) => setFeedbackText(stripEmojis(e.target.value))}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const d = feedbackText.trim();
                if (!d) {
                  toast.error('Enter a reason to dispute this section');
                  return;
                }
                onDispute(d);
                toast.info('Dispute recorded');
              }}
            >
              Dispute section
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onConfirm(feedbackText.trim() || undefined);
                toast.success(`${section.room} confirmed`);
              }}
            >
              Confirm section
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
