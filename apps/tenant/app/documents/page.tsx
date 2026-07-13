'use client';

import { FileText } from 'lucide-react';

import { TenantShell } from '@/components/layout/tenant-shell';
import { DocumentActions } from '@/components/tenant/document-actions';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { formatDate } from '@/lib/utils';

export default function DocumentsPage() {
  const { storedDocuments } = useTenantData();

  return (
    <TenantShell title="My documents">
      <p className="text-muted-foreground mb-4 text-sm">
        Lease agreements, receipts, and inspection reports linked to your tenancy.
      </p>
      <div className="space-y-3">
        {storedDocuments.map((d) => (
          <div key={d.id} className="rounded-xl border bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs">{d.category}</p>
                <p className="font-medium">{d.name}</p>
                <p className="text-muted-foreground text-xs">{formatDate(d.uploadedAt)}</p>
                {d.url ? (
                  <DocumentActions
                    documentId={d.id}
                    fileName={d.name}
                    documentUrl={d.url}
                    className="mt-3"
                    compact
                  />
                ) : (
                  <p className="text-muted-foreground mt-2 text-xs">
                    Preview not available for this file yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
        {storedDocuments.length === 0 && (
          <p className="text-muted-foreground text-sm">No documents available yet.</p>
        )}
      </div>
    </TenantShell>
  );
}
