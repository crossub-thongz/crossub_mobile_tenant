'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { tenantRentReviewNoticePdfUrl } from '@/lib/crossub-api/tenant-account-client';

export function RentReviewNoticePdfDialog({
  reviewId,
  open,
  onOpenChange,
}: {
  reviewId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pdfUrl = tenantRentReviewNoticePdfUrl(reviewId);

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

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close notice preview"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rent-review-notice-pdf-title"
        className="bg-card relative z-10 flex max-h-[min(92vh,760px)] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border shadow-lg sm:rounded-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <p id="rent-review-notice-pdf-title" className="text-sm font-semibold">
            Notice of rent increase
          </p>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs">
              <a
                href={pdfUrl}
                download={`notice-of-rent-increase-${reviewId.slice(0, 8)}.pdf`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="size-3.5" />
                Download
              </a>
            </Button>
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
        </div>
        <div className="min-h-0 flex-1 overflow-hidden bg-muted/20 p-3">
          <iframe
            title="Notice of rent increase PDF"
            src={pdfUrl}
            className="h-[min(75vh,640px)] w-full rounded-lg border bg-white"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
