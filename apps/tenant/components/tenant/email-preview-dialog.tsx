'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';

export interface EmailPreviewContent {
  subject: string;
  body: string;
  from: string;
  to: string;
  sentAt: string;
  kindLabel?: string;
}

export function EmailPreviewDialog({
  email,
  open,
  onOpenChange,
}: {
  email: EmailPreviewContent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onOpenChange]);

  if (!open || !email || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close email"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-preview-title"
        className="bg-card relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border shadow-lg sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
          <div className="min-w-0">
            <p id="email-preview-title" className="text-sm leading-snug font-semibold">
              {email.subject}
            </p>
            {email.kindLabel ? (
              <p className="text-muted-foreground mt-0.5 text-xs">{email.kindLabel}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8 shrink-0"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        <div className="space-y-3 overflow-y-auto px-4 py-4 text-sm">
          <p className="text-muted-foreground text-xs">Sent {formatDateTime(email.sentAt)}</p>
          <dl className="grid gap-2 text-xs">
            <div>
              <dt className="text-muted-foreground">From</dt>
              <dd className="font-medium break-words">{email.from}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">To</dt>
              <dd className="font-medium break-words">{email.to}</dd>
            </div>
          </dl>
          <div className="rounded-xl border bg-muted/20 p-3">
            <pre className="text-foreground/90 font-sans text-xs leading-relaxed whitespace-pre-wrap">
              {email.body}
            </pre>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
