'use client';

import { ImageIcon, Play } from 'lucide-react';

function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|webm|m4v)(\?|$)/i.test(url);
}

export function MaintenanceMediaGallery({
  photos,
  emptyLabel = 'No photos or videos uploaded.',
}: {
  photos: string[];
  emptyLabel?: string;
}) {
  if (photos.length === 0) {
    return (
      <p className="text-muted-foreground flex items-center gap-1 text-xs">
        <ImageIcon className="size-3" />
        {emptyLabel}
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {photos.map((url) => (
        <li key={url}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-secondary relative block aspect-square overflow-hidden rounded-lg border"
            title="Open full size"
          >
            {isVideoUrl(url) ? (
              <>
                <video src={url} className="size-full object-cover" muted playsInline />
                <span className="bg-background/80 absolute inset-0 flex items-center justify-center">
                  <Play className="text-foreground size-6" />
                </span>
              </>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="size-full object-cover" />
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}
