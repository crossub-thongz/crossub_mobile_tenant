'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Download } from 'lucide-react';

import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { getTenantDocument, tenantDocumentApiUrl } from '@/lib/tenant-documents';

export default function LeaseDocumentViewerPage() {
  const { id } = useParams<{ id: string }>();
  const doc = getTenantDocument(id);
  const previewUrl = tenantDocumentApiUrl(id);
  const downloadUrl = tenantDocumentApiUrl(id, true);

  if (!doc) {
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
    <TenantShell title={doc.title} backHref={ROUTES.LEASE}>
      <div className="flex flex-col gap-4 pb-6">
        <p className="text-muted-foreground text-sm">{doc.name}</p>
        <div className="overflow-hidden rounded-xl border bg-muted/30">
          <iframe
            title={doc.title}
            src={previewUrl}
            className="h-[min(70vh,560px)] w-full bg-white"
          />
        </div>
        <p className="text-muted-foreground text-xs">
          If the preview does not load on your device, use Download or Open in browser.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="flex-1">
            <a href={downloadUrl} download={doc.name}>
              <Download className="size-4" />
              Download PDF
            </a>
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <a href={previewUrl} target="_blank" rel="noopener noreferrer">
              Open in browser
            </a>
          </Button>
        </div>
      </div>
    </TenantShell>
  );
}
