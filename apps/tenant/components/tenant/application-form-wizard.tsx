'use client';

import { useEffect, useState } from 'react';

import { NswTenancyApplicationForm } from '@/components/tenant/nsw-tenancy-application-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  EMPLOYMENT_OPTIONS,
  type EmploymentStatus,
} from '@/lib/crossub-api/public-listings-client';
import {
  APPLICANT_SUMMARY_STEP,
  APPLICATION_FORM_STEPS,
  EMPTY_CO_APPLICANT,
  findFirstInvalidWizardStep,
  isBlankCoApplicant,
  MAX_CO_APPLICANTS,
  validateApplicantSummary,
  validateApplicationFormStep,
  type ApplicantSummaryInput,
  type ApplicationFormStepId,
  type CoApplicantInput,
  type NswTenancyApplicationFormData,
  type WizardStepId,
} from '@/lib/nsw-tenancy-application';

type WizardStep = typeof APPLICANT_SUMMARY_STEP | (typeof APPLICATION_FORM_STEPS)[number];

const WIZARD_STEPS: WizardStep[] = [APPLICANT_SUMMARY_STEP, ...APPLICATION_FORM_STEPS];

type Props = {
  propertyAddress: string;
  applicant: ApplicantSummaryInput;
  onApplicantChange: (next: ApplicantSummaryInput) => void;
  form: NswTenancyApplicationFormData;
  onFormChange: (next: NswTenancyApplicationFormData) => void;
  documentFiles: Record<string, File | null>;
  onDocumentSelect: (documentType: string, file: File | null) => void;
  uploadedDocumentTypes: Set<string>;
  submitting: boolean;
  onSubmit: () => void;
};

export function ApplicationFormWizard({
  propertyAddress,
  applicant,
  onApplicantChange,
  form,
  onFormChange,
  documentFiles,
  onDocumentSelect,
  uploadedDocumentTypes,
  submitting,
  onSubmit,
}: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const currentStep = WIZARD_STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === WIZARD_STEPS.length - 1;

  // Clear the banner when the user edits form data (not when we jump steps to show an error).
  useEffect(() => {
    setStepError(null);
  }, [applicant, form, uploadedDocumentTypes]);

  const validateStepAt = (index: number): string | null => {
    const step = WIZARD_STEPS[index];
    if (step.id === 'applicant') {
      return validateApplicantSummary(applicant);
    }
    return validateApplicationFormStep(
      step.id as ApplicationFormStepId,
      form,
      uploadedDocumentTypes,
    );
  };

  const goToStepId = (stepId: WizardStepId) => {
    const index = WIZARD_STEPS.findIndex((step) => step.id === stepId);
    if (index >= 0) setStepIndex(index);
  };

  const goNext = () => {
    const error = validateStepAt(stepIndex);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);
    setStepIndex((i) => Math.min(i + 1, WIZARD_STEPS.length - 1));
  };

  const goBack = () => {
    setStepError(null);
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Always re-check the whole wizard on final submit so skipped/back-edited
    // steps cannot bypass per-step Continue gates.
    const firstInvalid = findFirstInvalidWizardStep(
      applicant,
      form,
      uploadedDocumentTypes,
    );
    if (firstInvalid) {
      goToStepId(firstInvalid.stepId);
      setStepError(firstInvalid.error);
      return;
    }

    setStepError(null);
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Step {stepIndex + 1} of {WIZARD_STEPS.length}
          </span>
          <span className="font-medium text-foreground">
            {currentStep.letter !== '0' ? `${currentStep.letter}. ` : ''}
            {currentStep.title}
          </span>
        </div>
        <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all"
            style={{ width: `${((stepIndex + 1) / WIZARD_STEPS.length) * 100}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {WIZARD_STEPS.map((step, index) => (
            <button
              key={step.id}
              type="button"
              onClick={() => {
                if (index < stepIndex) {
                  setStepError(null);
                  setStepIndex(index);
                }
              }}
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                index === stepIndex
                  ? 'bg-primary text-primary-foreground'
                  : index < stepIndex
                    ? 'bg-muted text-foreground hover:bg-muted/80'
                    : 'text-muted-foreground'
              }`}
              disabled={index > stepIndex}
              aria-current={index === stepIndex ? 'step' : undefined}
            >
              {step.letter}
            </button>
          ))}
        </div>
      </div>

      {stepError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {stepError}
        </div>
      ) : null}

      {currentStep.id === 'applicant' ? (
        <section className="space-y-4 rounded-xl border bg-card p-4">
          <h2 className="text-sm font-semibold">{APPLICANT_SUMMARY_STEP.title}</h2>
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              placeholder="Michael Lee"
              value={applicant.fullName}
              onChange={(e) => onApplicantChange({ ...applicant, fullName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={applicant.email}
              onChange={(e) => onApplicantChange({ ...applicant, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={applicant.phone}
              onChange={(e) => onApplicantChange({ ...applicant, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="annualIncome">Annual income (AUD)</Label>
            <Input
              id="annualIncome"
              type="number"
              min={0}
              step={1000}
              value={applicant.annualIncome || ''}
              onChange={(e) =>
                onApplicantChange({
                  ...applicant,
                  annualIncome: Number(e.target.value) || 0,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employmentStatus">Employment</Label>
            <select
              id="employmentStatus"
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
              value={applicant.employmentStatus}
              onChange={(e) =>
                onApplicantChange({
                  ...applicant,
                  employmentStatus: e.target.value as EmploymentStatus,
                })
              }
            >
              {EMPLOYMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="moveInDate">Lease commencement / move-in date</Label>
            <Input
              id="moveInDate"
              type="date"
              value={applicant.moveInDate}
              onChange={(e) => onApplicantChange({ ...applicant, moveInDate: e.target.value })}
            />
          </div>

          <CoApplicantFields
            rows={applicant.coApplicants}
            onChange={(coApplicants) => onApplicantChange({ ...applicant, coApplicants })}
          />
        </section>
      ) : (
        <NswTenancyApplicationForm
          propertyAddress={propertyAddress}
          form={form}
          onChange={onFormChange}
          documentFiles={documentFiles}
          onDocumentSelect={onDocumentSelect}
          activeStep={currentStep.id as ApplicationFormStepId}
        />
      )}

      <div className="flex gap-3">
        {!isFirst && (
          <Button type="button" variant="outline" className="flex-1" onClick={goBack}>
            Back
          </Button>
        )}

        {isLast ? (
          <Button type="submit" disabled={submitting} className="flex-1">
            {submitting ? 'Submitting…' : 'Submit application'}
          </Button>
        ) : (
          <Button type="button" className="flex-1" onClick={goNext}>
            Continue
          </Button>
        )}
      </div>
    </form>
  );
}

/**
 * Everyone else who will be on the lease (CRS-0069).
 *
 * Deliberately here on the applicant step and not beside section C's "Adults" count: that
 * box is how many people will LIVE in the property, children included, and this list is who
 * will SIGN. Merging them is what left CROSSUB with "2 adults" and one name.
 *
 * Only the name is required. Someone with no email of their own is still a tenant, and a row
 * that never gets filled in is dropped on submit rather than blocking the form.
 */
function CoApplicantFields({
  rows,
  onChange,
}: {
  rows: CoApplicantInput[];
  onChange: (next: CoApplicantInput[]) => void;
}) {
  const namedCount = rows.filter((row) => !isBlankCoApplicant(row)).length;
  const canAdd = namedCount < MAX_CO_APPLICANTS;

  const patch = (index: number, next: Partial<CoApplicantInput>) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...next } : row)));
  };

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">Others on the lease</h3>
        <p className="text-muted-foreground text-xs">
          Anyone else who will sign the tenancy agreement with you — a partner or a
          housemate. Their details go straight onto the agreement, so you will not be asked
          for them again. Leave this empty if you are applying on your own.
        </p>
      </div>

      {rows.map((row, index) => (
        <div key={index} className="space-y-2 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Person {index + 2}</span>
            <button
              type="button"
              className="text-muted-foreground hover:text-destructive text-xs underline"
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`coApplicantName-${index}`}>Full name</Label>
            <Input
              id={`coApplicantName-${index}`}
              placeholder="Jessica Morris"
              value={row.fullName}
              onChange={(e) => patch(index, { fullName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`coApplicantEmail-${index}`}>Email (optional)</Label>
            <Input
              id={`coApplicantEmail-${index}`}
              type="email"
              value={row.email}
              onChange={(e) => patch(index, { email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`coApplicantPhone-${index}`}>Phone (optional)</Label>
            <Input
              id={`coApplicantPhone-${index}`}
              type="tel"
              value={row.phone}
              onChange={(e) => patch(index, { phone: e.target.value })}
            />
          </div>
        </div>
      ))}

      {canAdd ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => onChange([...rows, { ...EMPTY_CO_APPLICANT }])}
        >
          {rows.length === 0 ? 'Add someone else on the lease' : 'Add another person'}
        </Button>
      ) : (
        <p className="text-muted-foreground text-xs">
          You can name up to {MAX_CO_APPLICANTS} other people here. Tell us about anyone
          further in your message to the agent.
        </p>
      )}
    </div>
  );
}
