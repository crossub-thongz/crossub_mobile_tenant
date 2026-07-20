'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

const AUTO_DISMISS_MS = 10_000;

export function TenantMaintenanceCompletionPopup({
  open,
  onOpenChange,
  trackingNumber,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackingNumber: string;
}) {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => onOpenChange(false), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Dismiss completion notice"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="completion-uploaded-title"
        className="from-primary/10 to-card relative z-10 w-full max-w-sm rounded-2xl border border-primary/25 bg-gradient-to-br p-4 shadow-lg"
      >
        <div className="flex items-start gap-3">
          <div className="bg-primary/15 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
            <CheckCircle2 className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p id="completion-uploaded-title" className="font-semibold">
              Completion uploaded
            </p>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              The contractor has uploaded completion photos or videos for{' '}
              <span className="text-foreground font-medium">{trackingNumber}</span>. Review
              the evidence below and approve when you are satisfied.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
        <p className="text-muted-foreground mt-3 text-center text-[11px]">
          This notice closes automatically in a few seconds.
        </p>
      </div>
    </div>,
    document.body,
  );
}
