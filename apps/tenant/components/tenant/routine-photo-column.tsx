'use client';

import { useId, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';

import { NativeCameraSnapButton } from '@/components/tenant/native-camera-snap-button';
import { uploadMaintenancePhotoFile } from '@/lib/crossub-api/tenant-account-client';
import { IMAGE_UPLOAD_ACCEPT } from '@/lib/compress-image';
import { cn, resolveEvidenceMimeType } from '@/lib/utils';

const MAX_FILE_BYTES = 25 * 1024 * 1024;

export function RoutinePhotoColumn({
  title,
  photoUrls,
  uploading = false,
  disabled = false,
  sessionKey,
  onPhotosChange,
}: {
  title: string;
  photoUrls: string[];
  uploading?: boolean;
  disabled?: boolean;
  sessionKey?: string;
  onPhotosChange?: (urls: string[]) => void;
}) {
  const uploadId = useId();
  const inflight = useRef(0);
  const latestUrls = useRef(photoUrls);
  latestUrls.current = photoUrls;
  const [localUploading, setLocalUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const primaryUrl = photoUrls[0];

  const beginUpload = () => {
    inflight.current += 1;
    setLocalUploading(true);
  };

  const endUpload = () => {
    inflight.current = Math.max(0, inflight.current - 1);
    if (inflight.current === 0) setLocalUploading(false);
  };

  const uploadFile = async (file: File) => {
    const mime = resolveEvidenceMimeType(file);
    if (!mime.startsWith('image/') && !mime.startsWith('video/')) return null;
    if (file.size > MAX_FILE_BYTES) {
      toast.error('Photo is too large. Please choose a smaller image.');
      return null;
    }

    return uploadMaintenancePhotoFile(file, mime);
  };

  const addFiles = async (files: File[]) => {
    if (!files.length || disabled || !onPhotosChange) return;
    beginUpload();
    try {
      const urls: string[] = [];
      for (const file of files) {
        const url = await uploadFile(file);
        if (url) urls.push(url);
      }
      if (urls.length) onPhotosChange([...latestUrls.current, ...urls]);
    } catch {
      toast.error('Could not upload photo');
    } finally {
      endUpload();
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files?.length || disabled || !onPhotosChange) return;
    void addFiles(Array.from(files));
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
          {photoUrls.slice(1).map((url) => (
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
        <div className="flex flex-col gap-1.5">
          <NativeCameraSnapButton
            disabled={disabled}
            uploading={localUploading || uploading}
            sessionKey={sessionKey ?? title}
            className="w-full flex-none"
            onFiles={handleFiles}
          />
          <label
            htmlFor={uploadId}
            className={cn(
              'inline-flex w-full cursor-pointer items-center justify-center gap-1.5',
              'rounded-md border border-input bg-background px-3 text-xs font-medium',
              'shadow-xs hover:bg-accent hover:text-accent-foreground',
              'h-8',
              disabled && 'pointer-events-none opacity-60',
            )}
          >
            <ImagePlus className="size-3.5" />
            Upload
          </label>
        </div>
      ) : null}

      <input
        id={uploadId}
        type="file"
        accept={IMAGE_UPLOAD_ACCEPT}
        multiple
        className="sr-only"
        tabIndex={-1}
        disabled={disabled}
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = '';
        }}
      />

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
