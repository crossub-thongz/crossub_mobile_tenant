export interface TenantDocumentMeta {
  id: string;
  name: string;
  title: string;
  lines: string[];
  mimeType: 'application/pdf';
}

/** Demo document catalog — replace with API file URLs when backend is ready. */
export const TENANT_DOCUMENT_CATALOG: Record<string, TenantDocumentMeta> = {
  'doc-1': {
    id: 'doc-1',
    name: 'Signed lease agreement.pdf',
    title: 'Signed lease agreement',
    mimeType: 'application/pdf',
    lines: [
      'CROSSUB Tenant App — Demo document',
      'Signed lease agreement',
      'Property: 12 River Lane, Southbank VIC 3006',
      'Rent: $520 per week',
      'Term: 1 Jul 2026 – 30 Jun 2027',
      'This is a placeholder PDF for preview and download.',
    ],
  },
  'doc-2': {
    id: 'doc-2',
    name: 'Entry condition summary.pdf',
    title: 'Entry condition summary',
    mimeType: 'application/pdf',
    lines: [
      'CROSSUB Tenant App — Demo document',
      'Entry condition summary',
      'Property: 12 River Lane, Southbank',
      'Ingoing report reference: ing-301',
      'Uploaded: 12 Jun 2026',
    ],
  },
  'rcpt-801': {
    id: 'rcpt-801',
    name: 'Rent receipt — June 2026.pdf',
    title: 'Rent receipt — June 2026',
    mimeType: 'application/pdf',
    lines: [
      'Rent receipt RR-2026-06-0012',
      'Period: 1 Jun 2026 – 30 Jun 2026',
      'Amount: $2,257.33',
      'Property: 12 River Lane, Southbank',
    ],
  },
  'rcpt-802': {
    id: 'rcpt-802',
    name: 'Rent receipt — May 2026.pdf',
    title: 'Rent receipt — May 2026',
    mimeType: 'application/pdf',
    lines: [
      'Rent receipt RR-2026-05-0098',
      'Period: 1 May 2026 – 31 May 2026',
      'Amount: $2,257.33',
      'Property: 12 River Lane, Southbank',
    ],
  },
  'pp-dep': {
    id: 'pp-dep',
    name: 'deposit-transfer.pdf',
    title: 'Deposit payment proof',
    mimeType: 'application/pdf',
    lines: [
      'Deposit proof — $1,040',
      'Status: Approved',
      'Property: 12 River Lane, Southbank',
    ],
  },
};

export function getTenantDocument(id: string): TenantDocumentMeta | undefined {
  return TENANT_DOCUMENT_CATALOG[id];
}

export function tenantDocumentApiUrl(id: string, download = false): string {
  const q = download ? '?download=1' : '';
  return `/api/tenant-documents/${id}${q}`;
}
