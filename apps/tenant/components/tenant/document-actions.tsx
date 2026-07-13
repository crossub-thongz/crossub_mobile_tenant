'use client';

import { Download, ExternalLink, Eye } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { leaseDocumentView } from '@/constants/routes';
import { cn } from '@/lib/utils';

interface DocumentActionsProps {
  documentId: string;
  fileName: string;
  documentUrl?: string;
  className?: string;
  compact?: boolean;
}

export function DocumentActions({
  documentId,
  fileName,
  documentUrl,
  className,
  compact = false,
}: DocumentActionsProps) {
  const viewHref = documentUrl ?? leaseDocumentView(documentId);
  const downloadHref = documentUrl ?? viewHref;
  const external = Boolean(documentUrl);

  if (compact) {
    return (
      <div className={cn('flex gap-2', className)}>
        <Button variant="outline" size="sm" asChild>
          {external ? (
            <a href={viewHref} target="_blank" rel="noopener noreferrer">
              <Eye className="size-3.5" />
              View
            </a>
          ) : (
            <Link href={viewHref}>
              <Eye className="size-3.5" />
              View
            </Link>
          )}
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={downloadHref} download={fileName} target="_blank" rel="noopener noreferrer">
            <Download className="size-3.5" />
            Download
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <Button variant="secondary" size="sm" asChild className="flex-1 min-w-[7rem]">
        {external ? (
          <a href={viewHref} target="_blank" rel="noopener noreferrer">
            <Eye className="size-4" />
            View
          </a>
        ) : (
          <Link href={viewHref}>
            <Eye className="size-4" />
            View
          </Link>
        )}
      </Button>
      <Button variant="outline" size="sm" asChild className="flex-1 min-w-[7rem]">
        <a href={downloadHref} download={fileName} target="_blank" rel="noopener noreferrer">
          <Download className="size-4" />
          Download
        </a>
      </Button>
      <Button variant="ghost" size="sm" asChild className="w-full sm:w-auto">
        <a href={viewHref} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="size-4" />
          Open in browser
        </a>
      </Button>
    </div>
  );
}
