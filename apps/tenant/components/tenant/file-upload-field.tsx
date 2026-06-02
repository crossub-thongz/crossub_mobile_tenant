'use client';

import { FileImage, FileText, Upload, X } from 'lucide-react';
import { useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function fileLabel(file: File): string {
  if (file.size < 1024 * 1024) {
    return `${file.name} (${Math.round(file.size / 1024)} KB)`;
  }
  return `${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`;
}

export function FileUploadField({
  accept = 'image/*,.pdf',
  onFileSelect,
  className,
}: {
  accept?: string;
  onFileSelect?: (file: File | null) => void;
  className?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const setSelected = (next: File | null) => {
    setFile(next);
    onFileSelect?.(next);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null;
    setSelected(picked);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setSelected(dropped);
  };

  const isPdf = file?.type === 'application/pdf' || file?.name.endsWith('.pdf');

  return (
    <div className={cn('space-y-3', className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={onInputChange}
      />

      {!file ? (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 transition-colors',
            dragOver
              ? 'border-primary bg-primary/10'
              : 'border-border bg-card/50 hover:border-primary/50 hover:bg-secondary/40',
          )}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Upload className="size-6" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Upload payment proof</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Tap to choose a file, or drag and drop here
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" className="pointer-events-none">
            Choose file
          </Button>
          <p className="text-muted-foreground text-[11px]">PDF or image · max 10 MB recommended</p>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            {isPdf ? <FileText className="size-5" /> : <FileImage className="size-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{fileLabel(file)}</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-primary mt-0.5 text-xs font-medium hover:underline"
            >
              Replace file
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              if (inputRef.current) inputRef.current.value = '';
            }}
            className="text-muted-foreground hover:text-foreground flex size-8 shrink-0 items-center justify-center rounded-lg hover:bg-secondary"
            aria-label="Remove file"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
