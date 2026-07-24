'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ApplicationFormWizard } from '@/components/tenant/application-form-wizard';
import { ApplicationRentalFacts } from '@/components/tenant/application-rental-facts';
import { CheckInLinkedApplyPanel } from '@/components/tenant/check-in-linked-apply-panel';
import { TenantShell } from '@/components/layout/tenant-shell';
import { PageIntro } from '@/components/tenant/page-intro';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import {
  fetchPublicListing,
  submitGuestApplication,
  type SubmitGuestApplicationDocument,
  type SubmitGuestApplicationInput,
} from '@/lib/crossub-api/public-listings-client';
import type { ListingProperty } from '@/lib/types';
import { propertyApplySuccess, ROUTES } from '@/constants/routes';
import { APPLICATION_FORM_ENABLED } from '@/constants/feature-flags';
import { apiErrorMessage } from '@/lib/api-error-message';
import { fileToBase64 } from '@/lib/utils';
import {
  defaultNswApplicationForm,
  NSW_APPLICATION_DOCUMENT_SLOTS,
  type ApplicantSummaryInput,
  type NswTenancyApplicationFormData,
} from '@/lib/nsw-tenancy-application';

export default function ApplyPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const viewingSessionId = searchParams.get('sessionId') ?? undefined;
  const router = useRouter();
  const { listings } = useTenantData();
  const cachedProperty = listings.find((p) => p.id === id);
  const [property, setProperty] = useState<ListingProperty | null>(cachedProperty ?? null);
  const [loadingListing, setLoadingListing] = useState(!cachedProperty);
  const [submitting, setSubmitting] = useState(false);
  const [applicant, setApplicant] = useState<ApplicantSummaryInput>({
    fullName: '',
    email: '',
    phone: '',
    annualIncome: 0,
    employmentStatus: 'employed',
    moveInDate: '',
  });
  const [nswForm, setNswForm] = useState<NswTenancyApplicationFormData | null>(null);
  const [documentFiles, setDocumentFiles] = useState<Record<string, File | null>>({});

  useEffect(() => {
    let cancelled = false;
    setLoadingListing(true);
    void fetchPublicListing(id, viewingSessionId)
      .then((listing) => {
        if (!cancelled) setProperty(listing);
      })
      .catch(() => {
        if (!cancelled && cachedProperty) setProperty(cachedProperty);
      })
      .finally(() => {
        if (!cancelled) setLoadingListing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cachedProperty, id, viewingSessionId]);

  useEffect(() => {
    if (!property || nswForm) return;
    setNswForm(defaultNswApplicationForm('', '', '', '', property.address));
  }, [property, nswForm]);

  useEffect(() => {
    if (!nswForm) return;
    const parts = applicant.fullName.trim().split(/\s+/);
    const surname = parts.length > 1 ? parts[parts.length - 1] : '';
    const givenNames = parts.length > 1 ? parts.slice(0, -1).join(' ') : applicant.fullName;
    setNswForm((current) =>
      current
        ? {
            ...current,
            personal: { ...current.personal, givenNames, surname },
            declaration: {
              ...current.declaration,
              signatureName: applicant.fullName || current.declaration.signatureName,
              signatureDate: applicant.moveInDate || current.declaration.signatureDate,
            },
            contact: { ...current.contact, homePhone: applicant.phone || current.contact.homePhone },
          }
        : current,
    );
  }, [applicant.fullName, applicant.moveInDate, applicant.phone]);

  const uploadedDocumentTypes = useMemo(
    () =>
      new Set(
        Object.entries(documentFiles)
          .filter(([, file]) => file != null)
          .map(([documentType]) => documentType),
      ),
    [documentFiles],
  );

  const onSubmit = async () => {
    if (!property || !nswForm) return;

    setSubmitting(true);
    try {
      const documents: SubmitGuestApplicationDocument[] = [];
      for (const slot of NSW_APPLICATION_DOCUMENT_SLOTS) {
        const file = documentFiles[slot.documentType];
        if (!file) continue;
        documents.push({
          category: slot.category,
          documentType: slot.documentType,
          label: slot.label,
          points: slot.points,
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          contentBase64: await fileToBase64(file),
        });
      }

      const payload: SubmitGuestApplicationInput = {
        fullName: applicant.fullName,
        email: applicant.email,
        phone: applicant.phone,
        annualIncome: Number(applicant.annualIncome),
        employmentStatus: applicant.employmentStatus as SubmitGuestApplicationInput['employmentStatus'],
        moveInDate: applicant.moveInDate,
        formData: nswForm as unknown as Record<string, unknown>,
        documents,
        ...(viewingSessionId ? { viewingSessionId } : {}),
      };

      const result = await submitGuestApplication(property.id, payload);

      toast.success('Application submitted', {
        description: `Reference ${result.reference} — documents are filed under new-leasing onboarding.`,
      });
      router.push(
        `${propertyApplySuccess(property.id)}?ref=${encodeURIComponent(result.reference)}`,
      );
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not submit application'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingListing && !property) {
    return (
      <TenantShell title="Apply" backHref={`/properties/${id}`}>
        <p className="text-muted-foreground text-sm">Loading application details…</p>
      </TenantShell>
    );
  }

  if (!property) {
    return (
      <TenantShell title="Apply" backHref={ROUTES.PROPERTIES}>
        <p className="text-sm text-muted-foreground">Property not found.</p>
      </TenantShell>
    );
  }

  if (property.canApply === false) {
    return (
      <TenantShell title="Apply" backHref={`/properties/${id}`}>
        <p className="text-muted-foreground text-sm">
          This property is not accepting applications right now.
        </p>
      </TenantShell>
    );
  }

  // TESTING: NSW wizard disabled — one-tap apply from open inspection check-in.
  if (!APPLICATION_FORM_ENABLED) {
    return (
      <TenantShell title="Apply" backHref={`/properties/${id}`}>
        <CheckInLinkedApplyPanel
          property={property}
          viewingSessionId={viewingSessionId}
          onApplied={(reference) => {
            router.push(
              `${propertyApplySuccess(property.id)}?ref=${encodeURIComponent(reference)}`,
            );
          }}
        />
      </TenantShell>
    );
  }

  return (
    <TenantShell title="Application form" backHref={`/properties/${id}`}>
      <PageIntro
        title={property.address}
        description={
          viewingSessionId
            ? `${property.address} — open inspection application. Complete each step of the NSW tenancy form and upload your 100-point check documents.`
            : `${property.address} — complete each step of the NSW tenancy application form and upload supporting documents.`
        }
      />

      <ApplicationRentalFacts property={property} />

      {nswForm && (
        <ApplicationFormWizard
          propertyAddress={property.address}
          applicant={applicant}
          onApplicantChange={setApplicant}
          form={nswForm}
          onFormChange={setNswForm}
          documentFiles={documentFiles}
          onDocumentSelect={(documentType, file) =>
            setDocumentFiles((prev) => ({ ...prev, [documentType]: file }))
          }
          uploadedDocumentTypes={uploadedDocumentTypes}
          submitting={submitting}
          onSubmit={onSubmit}
        />
      )}

      <p className="text-muted-foreground mt-4 text-center text-xs">
        Already a tenant?{' '}
        <Link href={ROUTES.LOGIN} className="text-primary font-medium">
          Sign in
        </Link>
      </p>
    </TenantShell>
  );
}
