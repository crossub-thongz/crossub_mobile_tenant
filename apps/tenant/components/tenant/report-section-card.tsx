'use client';

import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import type { ReportSection } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

export function ReportSectionCard({
  section,
  onConfirm,
  onDispute,
}: {
  section: ReportSection;
  onConfirm: () => void;
  onDispute: (comment: string) => void;
}) {
  const [disputeText, setDisputeText] = useState(section.tenantDispute ?? '');
  const done = section.tenantConfirmed || !!section.tenantDispute;

  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="font-semibold">{section.room}</p>
      <p className="text-muted-foreground mt-1 text-sm">{section.description}</p>
      {section.photos.length > 0 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {section.photos.map((src) => (
            <div
              key={src}
              className="bg-secondary flex size-16 shrink-0 items-center justify-center rounded-lg text-xs text-muted-foreground"
            >
              Photo
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground mt-2 flex items-center gap-1 text-xs">
          <ImageIcon className="size-3" /> Photos on file with inspection report
        </p>
      )}
      {section.tenantConfirmed && section.confirmedAt && (
        <p className="text-primary mt-2 text-xs">
          Confirmed {formatDateTime(section.confirmedAt)}
        </p>
      )}
      {section.tenantDispute && (
        <p className="text-amber-400 mt-2 text-xs">Dispute: {section.tenantDispute}</p>
      )}
      {!done && (
        <div className="mt-3 space-y-2">
          <textarea
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Optional comment or dispute before confirming"
            value={disputeText}
            onChange={(e) => setDisputeText(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const d = disputeText.trim();
                if (!d) {
                  toast.error('Enter a dispute comment');
                  return;
                }
                onDispute(d);
                toast.info('Dispute recorded — timestamped for audit');
              }}
            >
              Raise dispute
            </Button>
            <Button size="sm" onClick={() => {
              onConfirm();
              toast.success(`${section.room} confirmed`);
            }}>
              Confirm section
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
