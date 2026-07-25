'use client';

import { useId, useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import { RoutineCameraCapture } from '@/components/tenant/routine-camera-capture';
import { Button } from '@/components/ui/button';
import { uploadMaintenancePhoto } from '@/lib/crossub-api/tenant-account-client';
import {
  compressImageForUpload,
  dataUrlToUploadParts,
} from '@/lib/compress-image';
import { cn, fileToBase64 } from '@/lib/utils';

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
  const nativeCameraId = useId();
  const nativeCameraRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [localUploading, setLocalUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const blocked = disabled || uploading || localUploading;
  const primaryUrl = photoUrls[0];

  const uploadDataUrl = async (dataUrl: string) => {
    const parts = dataUrlToUploadParts(dataUrl);
    if (!parts) {
      toast.error('Could not process photo');
      return null;
    }
    return uploadMaintenancePhoto({
      fileName: `routine-${Date.now()}.jpg`,
      mimeType: parts.mimeType,
      sizeBytes: parts.sizeBytes,
      contentBase64: parts.contentBase64,
    });
  };

  const uploadFile = async (file: File) => {
    const mime = file.type || 'image/jpeg';
    if (!mime.startsWith('image/') && !mime.startsWith('video/')) return null;
    if (file.size > MAX_FILE_BYTES) {
      toast.error('Photo is too large. Please choose a smaller image.');
      return null;
    }

    if (mime.startsWith('image/')) {
      const dataUrl = await compressImageForUpload(file);
      return uploadDataUrl(dataUrl);
    }

    const contentBase64 = await fileToBase64(file);
    return uploadMaintenancePhoto({
      fileName: file.name,
      mimeType: mime,
      sizeBytes: file.size,
      contentBase64,
    });
  };

  const addFiles = async (files: File[]) => {
    if (!files.length || blocked || !onPhotosChange) return;
    setLocalUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const url = await uploadFile(file);
        if (url) urls.push(url);
      }
      if (urls.length) onPhotosChange([...photoUrls, ...urls]);
    } catch {
      toast.error('Could not upload photo');
    } finally {
      setLocalUploading(false);
    }
  };

  const addDataUrl = async (dataUrl: string) => {
    if (blocked || !onPhotosChange) return;
    setLocalUploading(true);
    try {
      const url = await uploadDataUrl(dataUrl);
      if (url) onPhotosChange([...photoUrls, url]);
    } catch {
      toast.error('Could not upload photo');
    } finally {
      setLocalUploading(false);
    }
  };

  const openSnap = () => {
    if (blocked) return;
    if (typeof navigator.mediaDevices?.getUserMedia === 'function') {
      setCameraOpen(true);
      return;
    }
    nativeCameraRef.current?.click();
  };

  const handleFiles = (files: FileList | null) => {
    if (!files?.length || blocked) return;
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-1.5 text-xs"
            disabled={blocked}
            onClick={openSnap}
          >
            {blocked ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Camera className="size-3.5" />
            )}
            {blocked ? 'Uploading…' : 'Snap photo'}
          </Button>
          <label
            htmlFor={uploadId}
            className={cn(
              'inline-flex w-full cursor-pointer items-center justify-center gap-1.5',
              'rounded-md border border-input bg-background px-3 text-xs font-medium',
              'shadow-xs hover:bg-accent hover:text-accent-foreground',
              'h-8',
              blocked && 'pointer-events-none opacity-60',
            )}
          >
            <ImagePlus className="size-3.5" />
            Upload
          </label>
        </div>
      ) : null}

      <input
        id={nativeCameraId}
        ref={nativeCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        disabled={blocked}
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = '';
        }}
      />
      <input
        id={uploadId}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        disabled={blocked}
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = '';
        }}
      />

      <RoutineCameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(dataUrl) => {
          if (blocked) return;
          void addDataUrl(dataUrl);
        }}
        nativeInputId={nativeCameraId}
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
