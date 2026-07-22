'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { fetchAuthenticatedBlob } from '@/lib/api';

export function RentReviewLeaseAgreementPdfDialog({
  title,
  pdfUrl,
  downloadFileName,
  open,
  onOpenChange,
}: {
  title: string;
  pdfUrl: string;
  downloadFileName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!open) {
      setBlobUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setBlobUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });

    void fetchAuthenticatedBlob(pdfUrl)
      .then((blob) => {
        if (cancelled) return;
        setBlobUrl(URL.createObjectURL(blob));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : 'Could not load the agreement PDF';
        setError(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, pdfUrl]);

  useEffect(
    () => () => {
      setBlobUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
    },
    [],
  );

  const handleDownload = () => {
    if (!blobUrl) return;
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = downloadFileName;
    anchor.click();
  };

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close agreement preview"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rent-review-lease-agreement-pdf-title"
        className="bg-card relative z-10 flex max-h-[min(92vh,760px)] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border shadow-lg sm:rounded-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <p id="rent-review-lease-agreement-pdf-title" className="text-sm font-semibold">
            {title}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 px-2.5 text-xs"
              disabled={!blobUrl || loading}
              onClick={handleDownload}
            >
              <Download className="size-3.5" />
              Download
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
          {loading ? (
            <div className="flex h-[min(75vh,640px)] items-center justify-center rounded-lg border bg-white">
              <Loader2 className="text-muted-foreground size-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex h-[min(75vh,640px)] flex-col items-center justify-center gap-2 rounded-lg border bg-white px-6 text-center">
              <p className="text-sm font-medium">Could not load the agreement</p>
              <p className="text-muted-foreground text-xs">{error}</p>
            </div>
          ) : blobUrl ? (
            <iframe
              key={blobUrl}
              title={title}
              src={blobUrl}
              className="h-[min(75vh,640px)] w-full rounded-lg border bg-white"
            />
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
