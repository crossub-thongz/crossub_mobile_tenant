'use client';

import { useId, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { uploadMaintenancePhoto } from '@/lib/crossub-api/tenant-account-client';
import { fileToBase64 } from '@/lib/utils';
import { cn } from '@/lib/utils';

const MAX_FILE_BYTES = 25 * 1024 * 1024;

export function RoutinePhotoColumn({
  title,
  photoUrls,
  uploading = false,
  disabled = false,
  onPhotosChange,
}: {
  title: string;
  photoUrls: string[];
  uploading?: boolean;
  disabled?: boolean;
  onPhotosChange?: (urls: string[]) => void;
}) {
  const uploadId = useId();
  const [localUploading, setLocalUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const blocked = disabled || uploading || localUploading;
  const primaryUrl = photoUrls[0];

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || blocked) return;
    setLocalUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const mime = file.type || 'image/jpeg';
        if (!mime.startsWith('image/') && !mime.startsWith('video/')) continue;
        if (file.size > MAX_FILE_BYTES) continue;
        const contentBase64 = await fileToBase64(file);
        const url = await uploadMaintenancePhoto({
          fileName: file.name,
          mimeType: mime,
          sizeBytes: file.size,
          contentBase64,
        });
        urls.push(url);
      }
      if (urls.length && onPhotosChange) onPhotosChange([...photoUrls, ...urls]);
    } finally {
      setLocalUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-dashed p-2',
          primaryUrl ? 'border-border bg-secondary/30' : 'border-border/80',
        )}
      >
        {primaryUrl ? (
          <button
            type="button"
            onClick={() => setPreviewUrl(primaryUrl)}
            className="size-full"
            aria-label={`View ${title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={primaryUrl} alt={title} className="size-full rounded-md object-cover" />
          </button>
        ) : (
          <span className="px-2 text-center text-xs text-muted-foreground">{title}</span>
        )}
        {primaryUrl && !disabled && onPhotosChange ? (
          <button
            type="button"
            onClick={() => onPhotosChange(photoUrls.slice(1))}
            className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white"
            aria-label={`Remove ${title} photo`}
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      {photoUrls.length > 1 ? (
        <div className="grid grid-cols-3 gap-1">
          {photoUrls.slice(1).map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setPreviewUrl(url)}
              className="aspect-square overflow-hidden rounded border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {!disabled && onPhotosChange ? (
        <>
          <input
            id={uploadId}
            type="file"
            accept="image/*,video/*"
            multiple
            className="sr-only"
            disabled={blocked}
            onChange={(event) => void handleFiles(event.target.files)}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full gap-1.5 text-xs"
            disabled={blocked}
            onClick={() => document.getElementById(uploadId)?.click()}
          >
            {blocked ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ImagePlus className="size-3.5" />
            )}
            Add photo
          </Button>
        </>
      ) : null}

      {previewUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={`${title} preview`}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}
