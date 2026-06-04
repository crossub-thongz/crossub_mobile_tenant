'use client';

import { FileText } from 'lucide-react';

import { TenantShell } from '@/components/layout/tenant-shell';
import { DocumentActions } from '@/components/tenant/document-actions';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { getTenantDocument } from '@/lib/tenant-documents';
import { formatDate } from '@/lib/utils';

export default function DocumentsPage() {
  const { storedDocuments } = useTenantData();

  return (
    <TenantShell title="My documents">
      <p className="text-muted-foreground mb-4 text-sm">
        Single source of truth — lease, receipts, and uploaded proofs stored in the app (not
        scattered across email).
      </p>
      <div className="space-y-3">
        {storedDocuments.map((d) => {
          const available = Boolean(getTenantDocument(d.id));
          return (
            <div key={d.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <FileText className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-muted-foreground text-xs">{d.category}</p>
                  <p className="font-medium">{d.name}</p>
                  <p className="text-muted-foreground text-xs">{formatDate(d.uploadedAt)}</p>
                  {available ? (
                    <DocumentActions
                      documentId={d.id}
                      fileName={d.name}
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
          );
        })}
      </div>
    </TenantShell>
  );
}
