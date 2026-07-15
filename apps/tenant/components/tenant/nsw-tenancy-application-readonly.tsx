'use client';

import { NswTenancyApplicationForm } from '@/components/tenant/nsw-tenancy-application-form';
import {
  EMPTY_NSW_APPLICATION_FORM,
  type NswTenancyApplicationFormData,
} from '@/lib/nsw-tenancy-application';

export type SubmittedApplicationDocument = {
  category: string;
  documentType: string;
  label: string;
  points?: number;
  fileName: string;
  url: string;
  uploadedAt: string;
};

type Props = {
  propertyAddress: string;
  formData: Record<string, unknown> | null;
  documents: SubmittedApplicationDocument[];
};

function coerceFormData(raw: Record<string, unknown> | null): NswTenancyApplicationFormData {
  if (!raw) return EMPTY_NSW_APPLICATION_FORM;
  return {
    ...EMPTY_NSW_APPLICATION_FORM,
    ...(raw as NswTenancyApplicationFormData),
  };
}

export function NswTenancyApplicationReadonly({ propertyAddress, formData, documents }: Props) {
  const form = coerceFormData(formData);

  return (
    <div className="space-y-4">
      <NswTenancyApplicationForm
        propertyAddress={propertyAddress}
        form={form}
        onChange={() => {}}
        documentFiles={{}}
        onDocumentSelect={() => {}}
        readOnly
      />

      {documents.length > 0 && (
        <section className="space-y-3 rounded-xl border bg-card p-4">
          <h2 className="text-sm font-semibold">H. Uploaded documents</h2>
          <ul className="space-y-2 text-sm">
            {documents.map((doc) => (
              <li key={`${doc.documentType}-${doc.url}`} className="flex flex-col gap-0.5">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary font-medium underline"
                >
                  {doc.label}
                </a>
                <span className="text-muted-foreground text-xs">
                  {doc.fileName}
                  {doc.points != null ? ` · ${doc.points} pts` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
