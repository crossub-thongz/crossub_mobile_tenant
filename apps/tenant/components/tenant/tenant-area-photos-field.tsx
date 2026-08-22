'use client';

import { useId, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';

import { NativeCameraSnapButton } from '@/components/tenant/native-camera-snap-button';
import { Label } from '@/components/ui/label';
import { uploadMaintenancePhotoFile } from '@/lib/crossub-api/tenant-account-client';
import { IMAGE_UPLOAD_ACCEPT } from '@/lib/compress-image';
import { cn, resolveEvidenceMimeType } from '@/lib/utils';

const MAX_FILE_BYTES = 25 * 1024 * 1024;

type TenantAreaPhotosFieldProps = {
  label?: string;
  photoUrls: string[];
  uploading?: boolean;
  disabled?: boolean;
  emptyLabel?: string;
  sessionKey?: string;
  onPhotosChange?: (updater: (prev: string[]) => string[]) => void;
};

export function TenantAreaPhotosField({
  label = 'Photos',
  photoUrls,
  uploading = false,
  disabled = false,
  emptyLabel = 'Add at least one photo for this area.',
  sessionKey,
  onPhotosChange,
}: TenantAreaPhotosFieldProps) {
  const uploadId = useId();
  const inflight = useRef(0);
  const [localUploading, setLocalUploading] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const readOnly = disabled || !onPhotosChange;

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
    if (!files.length || readOnly) return;
    beginUpload();
    try {
      const urls: string[] = [];
      for (const file of files) {
        const url = await uploadFile(file);
        if (url) urls.push(url);
      }
      if (urls.length) onPhotosChange?.((prev) => [...prev, ...urls]);
    } catch {
      toast.error('Could not upload photo');
    } finally {
      endUpload();
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files?.length || readOnly) return;
    void addFiles(Array.from(files));
  };

  const previewUrl = previewIndex != null ? photoUrls[previewIndex] : null;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {!disabled && onPhotosChange ? (
        <div className="flex gap-2">
          <NativeCameraSnapButton
            disabled={disabled}
            uploading={localUploading || uploading}
            sessionKey={sessionKey ?? label}
            onFiles={handleFiles}
          />
          <label
            htmlFor={uploadId}
            className={cn(
              'inline-flex flex-1 cursor-pointer items-center justify-center gap-2',
              'rounded-md border border-input bg-background px-3 text-sm font-medium',
              'shadow-xs hover:bg-accent hover:text-accent-foreground',
              'h-8',
              disabled && 'pointer-events-none opacity-60',
            )}
          >
            <ImagePlus className="size-4" />
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

      {photoUrls.length === 0 ? (
        <p className="text-muted-foreground text-xs">{emptyLabel}</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2">
          {photoUrls.map((url, index) => (
            <li
              key={`${url.slice(0, 32)}-${index}`}
              className="relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary/30"
            >
              <button
                type="button"
                onClick={() => setPreviewIndex(index)}
                className="size-full"
                aria-label={`View photo ${index + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Photo ${index + 1}`}
                  className="size-full object-cover"
                />
              </button>
              {!disabled && onPhotosChange ? (
                <button
                  type="button"
                  onClick={() =>
                    onPhotosChange((prev) => prev.filter((_, i) => i !== index))
                  }
                  className={cn(
                    'absolute top-1 right-1 flex size-6 items-center justify-center',
                    'rounded-full bg-background/90 text-foreground shadow-sm',
                  )}
                  aria-label="Remove photo"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {previewUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Photo preview"
          onClick={() => setPreviewIndex(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewIndex(null)}
            className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white"
            aria-label="Close preview"
          >
            <X className="size-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Photo preview"
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}
