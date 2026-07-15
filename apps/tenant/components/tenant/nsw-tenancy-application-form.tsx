'use client';

import Link from 'next/link';

import { FileUploadField } from '@/components/tenant/file-upload-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  NSW_APPLICATION_DOCUMENT_SLOTS,
  NSW_APPLICATION_PDF_URL,
  type ApplicationFormStepId,
  type NswTenancyApplicationFormData,
} from '@/lib/nsw-tenancy-application';

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

function FormSection({ title, children }: SectionProps) {
  return (
    <section className="space-y-3 rounded-xl border bg-card p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

type Props = {
  propertyAddress: string;
  form: NswTenancyApplicationFormData;
  onChange: (next: NswTenancyApplicationFormData) => void;
  documentFiles: Record<string, File | null>;
  onDocumentSelect: (documentType: string, file: File | null) => void;
  /** When set, only the matching NSW section (A–I) is rendered. */
  activeStep?: ApplicationFormStepId;
  readOnly?: boolean;
};

export function NswTenancyApplicationForm({
  propertyAddress,
  form,
  onChange,
  documentFiles,
  onDocumentSelect,
  activeStep,
  readOnly = false,
}: Props) {
  const patch = <K extends keyof NswTenancyApplicationFormData,>(
    section: K,
    value: Partial<NswTenancyApplicationFormData[K]>,
  ) => {
    if (readOnly) return;
    onChange({
      ...form,
      [section]: { ...form[section], ...value },
    });
  };

  const show = (step: ApplicationFormStepId) => !activeStep || activeStep === step;
  const fieldProps = readOnly ? { readOnly: true, disabled: true } : {};

  return (
    <div className="space-y-4">
      {!activeStep && (
        <p className="text-muted-foreground text-sm">
          Complete all sections from the{' '}
          <a href={NSW_APPLICATION_PDF_URL} target="_blank" rel="noreferrer" className="text-primary underline">
            NSW tenancy application form
          </a>
          . Upload the documents listed in section H (100-point check).
        </p>
      )}

      {show('rentalProperty') ? (
        <FormSection title="A. Rental property details">
        <div className="space-y-2">
          <Label>Property address</Label>
          <Input value={propertyAddress} readOnly />
        </div>
        <div className="space-y-2">
          <Label htmlFor="secondPreference">Second preference address (optional)</Label>
          <Input
            id="secondPreference"
            value={form.rentalProperty.secondPreferenceAddress ?? ''}
            onChange={(e) => patch('rentalProperty', { secondPreferenceAddress: e.target.value })}
            {...fieldProps}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="leaseTerm">Lease term (months)</Label>
            <Input
              id="leaseTerm"
              value={form.rentalProperty.leaseTermMonths ?? ''}
              onChange={(e) => patch('rentalProperty', { leaseTermMonths: e.target.value })}
              {...fieldProps}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="propertySource">How did you find this property?</Label>
            <Input
              id="propertySource"
              value={form.rentalProperty.propertySource ?? ''}
              onChange={(e) => patch('rentalProperty', { propertySource: e.target.value })}
              {...fieldProps}
            />
          </div>
        </div>
        </FormSection>
      ) : null}

      {show('personal') ? (
        <FormSection title="B. Personal details">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.personal.title ?? ''}
              onChange={(e) => patch('personal', { title: e.target.value })}
              placeholder="Mr / Ms / Mrs"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dob">Date of birth</Label>
            <Input
              id="dob"
              type="date"
              value={form.personal.dateOfBirth ?? ''}
              onChange={(e) => patch('personal', { dateOfBirth: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="givenNames">Given name(s)</Label>
            <Input
              id="givenNames"
              value={form.personal.givenNames ?? ''}
              onChange={(e) => patch('personal', { givenNames: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="surname">Surname</Label>
            <Input
              id="surname"
              value={form.personal.surname ?? ''}
              onChange={(e) => patch('personal', { surname: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="dlNo">Driver&apos;s licence no.</Label>
            <Input
              id="dlNo"
              value={form.personal.driversLicenseNo ?? ''}
              onChange={(e) => patch('personal', { driversLicenseNo: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dlState">Licence state</Label>
            <Input
              id="dlState"
              value={form.personal.driversLicenseState ?? ''}
              onChange={(e) => patch('personal', { driversLicenseState: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="passportNo">Passport no.</Label>
            <Input
              id="passportNo"
              value={form.personal.passportNo ?? ''}
              onChange={(e) => patch('personal', { passportNo: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="passportCountry">Passport country</Label>
            <Input
              id="passportCountry"
              value={form.personal.passportCountry ?? ''}
              onChange={(e) => patch('personal', { passportCountry: e.target.value })}
            />
          </div>
        </div>
        </FormSection>
      ) : null}

      {show('contactOccupancy') ? (
        <FormSection title="C. Contact & occupancy">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="homePhone">Home phone</Label>
            <Input
              id="homePhone"
              value={form.contact.homePhone ?? ''}
              onChange={(e) => patch('contact', { homePhone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workPhone">Work phone</Label>
            <Input
              id="workPhone"
              value={form.contact.workPhone ?? ''}
              onChange={(e) => patch('contact', { workPhone: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="adults">Adults</Label>
            <Input
              id="adults"
              value={form.occupancy.adults ?? ''}
              onChange={(e) => patch('occupancy', { adults: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="children">Children</Label>
            <Input
              id="children"
              value={form.occupancy.children ?? ''}
              onChange={(e) => patch('occupancy', { children: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="childrenAges">Children ages</Label>
            <Input
              id="childrenAges"
              value={form.occupancy.childrenAges ?? ''}
              onChange={(e) => patch('occupancy', { childrenAges: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="petDetails">Pets (type/breed if any)</Label>
          <Input
            id="petDetails"
            value={form.occupancy.petDetails ?? ''}
            onChange={(e) => patch('occupancy', { petDetails: e.target.value })}
          />
        </div>
        </FormSection>
      ) : null}

      {show('currentAddress') ? (
        <FormSection title="D. Applicant history — current address">
        <div className="space-y-2">
          <Label htmlFor="currentAddress">Current address</Label>
          <textarea
            id="currentAddress"
            value={form.currentAddress.address ?? ''}
            onChange={(e) => patch('currentAddress', { address: e.target.value })}
            rows={2}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[60px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="currentYears">Years at address</Label>
            <Input
              id="currentYears"
              value={form.currentAddress.years ?? ''}
              onChange={(e) => patch('currentAddress', { years: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currentMonths">Months</Label>
            <Input
              id="currentMonths"
              value={form.currentAddress.months ?? ''}
              onChange={(e) => patch('currentAddress', { months: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currentPostcode">Postcode</Label>
            <Input
              id="currentPostcode"
              value={form.currentAddress.postcode ?? ''}
              onChange={(e) => patch('currentAddress', { postcode: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="leavingReason">Why are you leaving?</Label>
          <Input
            id="leavingReason"
            value={form.currentAddress.leavingReason ?? ''}
            onChange={(e) => patch('currentAddress', { leavingReason: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="landlordName">Current landlord/agent</Label>
            <Input
              id="landlordName"
              value={form.currentAddress.landlordName ?? ''}
              onChange={(e) => patch('currentAddress', { landlordName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="landlordPhone">Landlord/agent phone</Label>
            <Input
              id="landlordPhone"
              value={form.currentAddress.landlordPhone ?? ''}
              onChange={(e) => patch('currentAddress', { landlordPhone: e.target.value })}
            />
          </div>
        </div>
        </FormSection>
      ) : null}

      {show('previousAddress') ? (
        <FormSection title="E. Previous address">
        <div className="space-y-2">
          <Label htmlFor="previousAddress">Previous residential address</Label>
          <textarea
            id="previousAddress"
            value={form.previousAddress.address ?? ''}
            onChange={(e) => patch('previousAddress', { address: e.target.value })}
            rows={2}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[60px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="prevYears">Years</Label>
            <Input
              id="prevYears"
              value={form.previousAddress.years ?? ''}
              onChange={(e) => patch('previousAddress', { years: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prevMonths">Months</Label>
            <Input
              id="prevMonths"
              value={form.previousAddress.months ?? ''}
              onChange={(e) => patch('previousAddress', { months: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prevPostcode">Postcode</Label>
            <Input
              id="prevPostcode"
              value={form.previousAddress.postcode ?? ''}
              onChange={(e) => patch('previousAddress', { postcode: e.target.value })}
            />
          </div>
        </div>
        </FormSection>
      ) : null}

      {show('employment') ? (
        <FormSection title="F. Employment">
        <div className="space-y-2">
          <Label htmlFor="occupation">Occupation</Label>
          <Input
            id="occupation"
            value={form.employment.occupation ?? ''}
            onChange={(e) => patch('employment', { occupation: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="employerName">Employer name</Label>
          <Input
            id="employerName"
            value={form.employment.employerName ?? ''}
            onChange={(e) => patch('employment', { employerName: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="employmentType">Employment type</Label>
            <Input
              id="employmentType"
              value={form.employment.employmentType ?? ''}
              onChange={(e) => patch('employment', { employmentType: e.target.value })}
              placeholder="Full time / Part time / Casual"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="netWeeklyIncome">Net weekly income ($)</Label>
            <Input
              id="netWeeklyIncome"
              value={form.employment.netWeeklyIncome ?? ''}
              onChange={(e) => patch('employment', { netWeeklyIncome: e.target.value })}
            />
          </div>
        </div>
        </FormSection>
      ) : null}

      {show('emergencyReferences') ? (
        <FormSection title="G. Emergency contact & references">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="emergencyGiven">Emergency contact — given name(s)</Label>
            <Input
              id="emergencyGiven"
              value={form.emergencyContact.givenNames ?? ''}
              onChange={(e) => patch('emergencyContact', { givenNames: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencySurname">Surname</Label>
            <Input
              id="emergencySurname"
              value={form.emergencyContact.surname ?? ''}
              onChange={(e) => patch('emergencyContact', { surname: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="emergencyRelationship">Relationship</Label>
            <Input
              id="emergencyRelationship"
              value={form.emergencyContact.relationship ?? ''}
              onChange={(e) => patch('emergencyContact', { relationship: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyMobile">Mobile phone</Label>
            <Input
              id="emergencyMobile"
              value={form.emergencyContact.mobilePhone ?? ''}
              onChange={(e) => patch('emergencyContact', { mobilePhone: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="ref1Name">Reference 1 — name</Label>
            <Input
              id="ref1Name"
              value={form.references.reference1GivenNames ?? ''}
              onChange={(e) => patch('references', { reference1GivenNames: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ref1Phone">Reference 1 — phone</Label>
            <Input
              id="ref1Phone"
              value={form.references.reference1Phone ?? ''}
              onChange={(e) => patch('references', { reference1Phone: e.target.value })}
            />
          </div>
        </div>
        </FormSection>
      ) : null}

      {show('documents') && !readOnly ? (
        <FormSection title="H. 100-point check — upload documents">
        <p className="text-muted-foreground text-xs">
          Minimum 100 points required across identity (A), income (B), and supporting (C) categories.
        </p>
        {(['identity', 'income', 'supporting'] as const).map((category) => (
          <div key={category} className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {category === 'identity'
                ? 'A) Proof of identity'
                : category === 'income'
                  ? 'B) Proof of income'
                  : 'C) Supporting documentation'}
            </h3>
            {NSW_APPLICATION_DOCUMENT_SLOTS.filter((slot) => slot.category === category).map(
              (slot) => (
                <div key={slot.documentType} className="rounded-lg border p-3">
                  <p className="mb-2 text-sm font-medium">
                    {slot.label}{' '}
                    <span className="text-muted-foreground font-normal">({slot.points} pts)</span>
                  </p>
                  {slot.hint && (
                    <p className="text-muted-foreground mb-2 text-xs">{slot.hint}</p>
                  )}
                  <FileUploadField
                    label={`Upload ${slot.label}`}
                    hint="PDF or image"
                    onFileSelect={(file) => onDocumentSelect(slot.documentType, file)}
                  />
                  {documentFiles[slot.documentType] && (
                    <p className="text-muted-foreground mt-2 text-xs">
                      Selected: {documentFiles[slot.documentType]?.name}
                    </p>
                  )}
                </div>
              ),
            )}
          </div>
        ))}
        </FormSection>
      ) : null}

      {show('declaration') ? (
        <FormSection title="I. Declaration">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={Boolean(form.declaration.termsAccepted)}
            disabled={readOnly}
            onChange={(e) => patch('declaration', { termsAccepted: e.target.checked })}
          />
          <span>
            I have read and accept the terms and conditions in the NSW tenancy application form.
          </span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="signatureName">Print name</Label>
            <Input
              id="signatureName"
              value={form.declaration.signatureName ?? ''}
              onChange={(e) => patch('declaration', { signatureName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signatureDate">Date</Label>
            <Input
              id="signatureDate"
              type="date"
              value={form.declaration.signatureDate ?? ''}
              onChange={(e) => patch('declaration', { signatureDate: e.target.value })}
            />
          </div>
        </div>
        <p className="text-muted-foreground text-xs">
          Full terms:{' '}
          <Link href={NSW_APPLICATION_PDF_URL} target="_blank" className="text-primary underline">
            view PDF
          </Link>
        </p>
        </FormSection>
      ) : null}
    </div>
  );
}
