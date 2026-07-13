'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Download } from 'lucide-react';

import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';

export default function LeaseDocumentViewerPage() {
  const { id } = useParams<{ id: string }>();
  const { storedDocuments } = useTenantData();
  const doc = storedDocuments.find((d) => d.id === id);

  if (!doc?.url) {
    return (
      <TenantShell title="Document" backHref={ROUTES.LEASE}>
        <p className="text-muted-foreground text-sm">Document not found.</p>
        <Link href={ROUTES.LEASE} className="text-primary mt-4 inline-block text-sm font-medium">
          Back to My lease
        </Link>
      </TenantShell>
    );
  }

  return (
    <TenantShell title={doc.name} backHref={ROUTES.LEASE}>
      <div className="flex flex-col gap-4 pb-6">
        <p className="text-muted-foreground text-sm">{doc.category}</p>
        <div className="overflow-hidden rounded-xl border bg-muted/30">
          <iframe
            title={doc.name}
            src={doc.url}
            className="h-[min(70vh,560px)] w-full bg-white"
          />
        </div>
        <p className="text-muted-foreground text-xs">
          If the preview does not load on your device, use Download or Open in browser.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="flex-1">
            <a href={doc.url} download={doc.name} target="_blank" rel="noopener noreferrer">
              <Download className="size-4" />
              Download PDF
            </a>
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <a href={doc.url} target="_blank" rel="noopener noreferrer">
              Open in browser
            </a>
          </Button>
        </div>
      </div>
    </TenantShell>
  );
}
