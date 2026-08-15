export type ApplicationDocumentCategory = 'identity' | 'income' | 'supporting';

export type ApplicationDocumentSlot = {
  documentType: string;
  label: string;
  category: ApplicationDocumentCategory;
  points: number;
  required?: boolean;
  hint?: string;
};

/** NSW tenancy application 100-point check — mirrors section H of the standard PDF. */
export const NSW_APPLICATION_DOCUMENT_SLOTS: ApplicationDocumentSlot[] = [
  {
    category: 'identity',
    documentType: 'drivers_licence',
    label: "Driver's licence",
    points: 30,
    required: true,
    hint: 'Proof of identity (section A) — provide one primary ID document.',
  },
  {
    category: 'identity',
    documentType: 'passport',
    label: 'Passport',
    points: 30,
  },
  {
    category: 'identity',
    documentType: 'birth_certificate_photo_id',
    label: 'Birth certificate + photo ID',
    points: 30,
  },
  {
    category: 'income',
    documentType: 'pay_advice',
    label: 'Last pay advice',
    points: 30,
    required: true,
    hint: 'Proof of income (section B) — provide at least one income document.',
  },
  {
    category: 'income',
    documentType: 'centrelink_statement',
    label: 'Current Centrelink statement',
    points: 30,
  },
  {
    category: 'income',
    documentType: 'bank_statement',
    label: 'Current bank statement',
    points: 30,
    hint: 'Must show sufficient funds to meet rental payments.',
  },
  {
    category: 'supporting',
    documentType: 'rental_ledger',
    label: 'Current rental ledger (from agent)',
    points: 40,
  },
  {
    category: 'supporting',
    documentType: 'rent_receipts',
    label: 'Last two rent receipts',
    points: 20,
  },
  {
    category: 'supporting',
    documentType: 'written_references',
    label: 'Two written references',
    points: 20,
  },
  {
    category: 'supporting',
    documentType: 'rates_notice',
    label: 'Recent rates notice',
    points: 30,
  },
  {
    category: 'supporting',
    documentType: 'vehicle_registration',
    label: 'Vehicle registration papers',
    points: 10,
  },
  {
    category: 'supporting',
    documentType: 'utility_bill',
    label: 'Current electricity or phone account',
    points: 10,
  },
];

export const NSW_APPLICATION_PDF_URL =
  'https://www.onlinerealestateagents.com.au/wp-content/uploads/2020/10/15050934371.pdf';

export type NswTenancyApplicationFormData = {
  rentalProperty: {
    secondPreferenceAddress?: string;
    leaseTermMonths?: string;
    propertySource?: string;
  };
  personal: {
    title?: string;
    givenNames?: string;
    surname?: string;
    dateOfBirth?: string;
    driversLicenseNo?: string;
    driversLicenseState?: string;
    passportNo?: string;
    passportCountry?: string;
    pensionType?: string;
  };
  contact: {
    homePhone?: string;
    workPhone?: string;
    fax?: string;
  };
  occupancy: {
    adults?: string;
    children?: string;
    childrenAges?: string;
    hasPets?: 'yes' | 'no';
    petDetails?: string;
    carRegistration?: string;
  };
  currentAddress: {
    address?: string;
    years?: string;
    months?: string;
    postcode?: string;
    leavingReason?: string;
    landlordName?: string;
    landlordPhone?: string;
    weeklyRent?: string;
  };
  previousAddress: {
    address?: string;
    years?: string;
    months?: string;
    postcode?: string;
    landlordName?: string;
    landlordPhone?: string;
    weeklyRent?: string;
    bondRefunded?: 'yes' | 'no';
    bondNotRefundedReason?: string;
  };
  employment: {
    occupation?: string;
    employerName?: string;
    employerAddress?: string;
    contactName?: string;
    employmentType?: string;
    lengthYears?: string;
    lengthMonths?: string;
    netWeeklyIncome?: string;
  };
  previousEmployment: {
    occupation?: string;
    employerName?: string;
    lengthYears?: string;
    lengthMonths?: string;
    netWeeklyIncome?: string;
  };
  emergencyContact: {
    surname?: string;
    givenNames?: string;
    relationship?: string;
    homePhone?: string;
    workPhone?: string;
    mobilePhone?: string;
  };
  references: {
    reference1Surname?: string;
    reference1GivenNames?: string;
    reference1Relationship?: string;
    reference1Phone?: string;
    reference2Surname?: string;
    reference2GivenNames?: string;
    reference2Relationship?: string;
    reference2Phone?: string;
  };
  declaration: {
    inspectedProperty?: 'yes' | 'no';
    propertyClean?: 'yes' | 'no';
    cleanIssues?: string;
    termsAccepted?: boolean;
    signatureName?: string;
    signatureDate?: string;
  };
  utilities: {
    directConnectOptIn?: boolean;
  };
};

export const EMPTY_NSW_APPLICATION_FORM: NswTenancyApplicationFormData = {
  rentalProperty: {},
  personal: {},
  contact: {},
  occupancy: {},
  currentAddress: {},
  previousAddress: {},
  employment: {},
  previousEmployment: {},
  emergencyContact: {},
  references: {},
  declaration: {},
  utilities: {},
};

export function defaultNswApplicationForm(
  fullName: string,
  email: string,
  phone: string,
  moveInDate: string,
  propertyAddress: string,
): NswTenancyApplicationFormData {
  const parts = fullName.trim().split(/\s+/);
  const surname = parts.length > 1 ? parts[parts.length - 1] : '';
  const givenNames = parts.length > 1 ? parts.slice(0, -1).join(' ') : fullName;
  return {
    ...EMPTY_NSW_APPLICATION_FORM,
    rentalProperty: {
      leaseTermMonths: '',
      propertySource: '',
    },
    personal: {
      givenNames,
      surname,
    },
    contact: {
      homePhone: phone,
    },
    declaration: {
      signatureName: fullName,
      signatureDate: moveInDate,
    },
    occupancy: {},
    currentAddress: {},
    previousAddress: {},
    employment: {},
    previousEmployment: {},
    emergencyContact: {},
    references: {},
    utilities: {},
  };
}

export function validateNswApplicationForm(
  form: NswTenancyApplicationFormData,
  uploadedDocumentTypes: Set<string>,
): string | null {
  if (!form.declaration.termsAccepted) {
    return 'Accept the terms and conditions to submit your application.';
  }
  if (!form.declaration.signatureName?.trim()) {
    return 'Enter your printed name on the declaration.';
  }

  const hasIdentity = NSW_APPLICATION_DOCUMENT_SLOTS.some(
    (slot) =>
      slot.category === 'identity' && uploadedDocumentTypes.has(slot.documentType),
  );
  if (!hasIdentity) {
    return 'Upload at least one proof of identity document (section H — category A).';
  }

  const hasIncome = NSW_APPLICATION_DOCUMENT_SLOTS.some(
    (slot) =>
      slot.category === 'income' && uploadedDocumentTypes.has(slot.documentType),
  );
  if (!hasIncome) {
    return 'Upload at least one proof of income document (section H — category B).';
  }

  const supportingPoints = NSW_APPLICATION_DOCUMENT_SLOTS.filter(
    (slot) =>
      slot.category === 'supporting' && uploadedDocumentTypes.has(slot.documentType),
  ).reduce((sum, slot) => sum + slot.points, 0);
  if (supportingPoints < 40) {
    return 'Upload supporting documents totalling at least 40 points (section H — category C).';
  }

  return null;
}

/** Wizard step identifiers — applicant summary is step 0; NSW sections A–I follow. */
export type ApplicationFormStepId =
  | 'rentalProperty'
  | 'personal'
  | 'contactOccupancy'
  | 'currentAddress'
  | 'previousAddress'
  | 'employment'
  | 'emergencyReferences'
  | 'documents'
  | 'declaration';

/**
 * Another adult who will be on the lease, named on this same application (CRS-0069).
 *
 * Until this existed a rental application was single-applicant by construction — one name,
 * one email, one phone — and section C recorded "adults" as a COUNT with no names. A couple
 * applying together therefore never sent the second person at all, so the agreement CROSSUB
 * drafted could only ever carry one of them, and an officer had to type the other in by hand.
 *
 * Only the name is required. A partner or housemate with no email of their own is still a
 * party to the lease, and refusing the row for a missing address would send the household
 * back to naming nobody — which is the state this replaces. A blank costs one empty contact
 * line on the contract; a missing person costs a tenant.
 */
export type CoApplicantInput = {
  fullName: string;
  email: string;
  phone: string;
};

/** Matches `MAX_APPLICATION_CO_APPLICANTS` on the API, which rejects a longer array. */
export const MAX_CO_APPLICANTS = 5;

export const EMPTY_CO_APPLICANT: CoApplicantInput = {
  fullName: '',
  email: '',
  phone: '',
};

/** True for a row the applicant opened and never filled in — dropped, not rejected. */
export function isBlankCoApplicant(row: CoApplicantInput): boolean {
  return !row.fullName.trim() && !row.email.trim() && !row.phone.trim();
}

export type ApplicantSummaryInput = {
  fullName: string;
  email: string;
  phone: string;
  annualIncome: number;
  employmentStatus: string;
  moveInDate: string;
  /** Everyone else who will sign the lease. Empty for a solo application. */
  coApplicants: CoApplicantInput[];
};

export const APPLICATION_FORM_STEPS: { id: ApplicationFormStepId; title: string; letter: string }[] =
  [
    { id: 'rentalProperty', title: 'Rental property details', letter: 'A' },
    { id: 'personal', title: 'Personal details', letter: 'B' },
    { id: 'contactOccupancy', title: 'Contact & occupancy', letter: 'C' },
    { id: 'currentAddress', title: 'Current address', letter: 'D' },
    { id: 'previousAddress', title: 'Previous address', letter: 'E' },
    { id: 'employment', title: 'Employment', letter: 'F' },
    { id: 'emergencyReferences', title: 'Emergency contact & references', letter: 'G' },
    { id: 'documents', title: '100-point check — documents', letter: 'H' },
    { id: 'declaration', title: 'Declaration', letter: 'I' },
  ];

export const APPLICANT_SUMMARY_STEP = {
  id: 'applicant' as const,
  title: 'Applicant summary',
  letter: '0',
};

function isBlank(value: string | undefined): boolean {
  return !value?.trim();
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Check the other adults on the lease.
 *
 * A blank row is skipped rather than rejected — "Add another" creates one on click, and an
 * applicant who opens one and changes their mind should not be blocked by it. What is
 * rejected is a row with contact details and no name, because that is a tenant nobody can
 * name, and it would reach the agreement as an empty slot on a document people sign.
 */
export function validateCoApplicants(
  rows: CoApplicantInput[],
  applicantEmail: string,
): string | null {
  const named = rows.filter((row) => !isBlankCoApplicant(row));
  if (named.length > MAX_CO_APPLICANTS) {
    return `You can name up to ${MAX_CO_APPLICANTS} other people on this application.`;
  }

  const seen = new Set<string>([applicantEmail.trim().toLowerCase()].filter(Boolean));
  const seenNames = new Set<string>();
  for (const row of named) {
    const fullName = row.fullName.trim();
    if (!fullName) {
      return 'Enter the full name of everyone you have added, or clear the row.';
    }
    if (fullName.length < 2) return `"${fullName}" is too short to be a full name.`;

    const email = row.email.trim().toLowerCase();
    if (email && !EMAIL_PATTERN.test(email)) {
      return `Enter a valid email address for ${fullName}, or leave it blank.`;
    }
    if (email && seen.has(email)) {
      return `${fullName} has the same email address as someone else on this application.`;
    }
    if (email) seen.add(email);

    const nameKey = fullName.toLowerCase().replace(/\s+/g, ' ');
    if (seenNames.has(nameKey)) return `${fullName} is on this application twice.`;
    seenNames.add(nameKey);
  }
  return null;
}

export function validateApplicantSummary(input: ApplicantSummaryInput): string | null {
  if (!input.fullName.trim()) return 'Enter your full name.';
  if (!input.email.trim()) return 'Enter your email address.';
  if (!EMAIL_PATTERN.test(input.email.trim())) {
    return 'Enter a valid email address.';
  }
  if (!input.phone.trim()) return 'Enter your phone number.';
  if (!input.moveInDate) return 'Select your preferred move-in date.';
  if (!input.annualIncome || input.annualIncome <= 0) return 'Enter your annual income.';
  return validateCoApplicants(input.coApplicants ?? [], input.email);
}

/** The rows worth sending — blank ones dropped, values trimmed. */
export function submittableCoApplicants(
  rows: CoApplicantInput[],
): { fullName: string; email?: string; phone?: string }[] {
  return rows
    .filter((row) => !isBlankCoApplicant(row))
    .map((row) => ({
      fullName: row.fullName.trim(),
      ...(row.email.trim() ? { email: row.email.trim() } : {}),
      ...(row.phone.trim() ? { phone: row.phone.trim() } : {}),
    }))
    .filter((row) => row.fullName.length > 0);
}

export function validateApplicationFormStep(
  stepId: ApplicationFormStepId,
  form: NswTenancyApplicationFormData,
  uploadedDocumentTypes: Set<string>,
): string | null {
  switch (stepId) {
    case 'rentalProperty':
      if (isBlank(form.rentalProperty.leaseTermMonths)) {
        return 'Enter the lease term (months).';
      }
      if (isBlank(form.rentalProperty.propertySource)) {
        return 'Tell us how you found this property.';
      }
      return null;

    case 'personal':
      if (isBlank(form.personal.givenNames)) return 'Enter your given name(s).';
      if (isBlank(form.personal.surname)) return 'Enter your surname.';
      if (isBlank(form.personal.dateOfBirth)) return 'Enter your date of birth.';
      return null;

    case 'contactOccupancy':
      if (isBlank(form.contact.homePhone) && isBlank(form.contact.workPhone)) {
        return 'Provide at least one contact phone number.';
      }
      if (isBlank(form.occupancy.adults)) return 'Enter the number of adults.';
      return null;

    case 'currentAddress':
      if (isBlank(form.currentAddress.address)) return 'Enter your current address.';
      if (isBlank(form.currentAddress.years) && isBlank(form.currentAddress.months)) {
        return 'Enter how long you have lived at your current address.';
      }
      if (isBlank(form.currentAddress.landlordName)) {
        return 'Enter your current landlord or agent name.';
      }
      return null;

    case 'previousAddress':
      // Optional section — no required fields
      return null;

    case 'employment':
      if (isBlank(form.employment.occupation)) return 'Enter your occupation.';
      if (isBlank(form.employment.employerName)) return 'Enter your employer name.';
      if (isBlank(form.employment.netWeeklyIncome)) return 'Enter your net weekly income.';
      return null;

    case 'emergencyReferences':
      if (isBlank(form.emergencyContact.givenNames) || isBlank(form.emergencyContact.surname)) {
        return 'Enter your emergency contact name.';
      }
      if (isBlank(form.emergencyContact.mobilePhone) && isBlank(form.emergencyContact.homePhone)) {
        return 'Enter an emergency contact phone number.';
      }
      if (isBlank(form.references.reference1GivenNames)) {
        return 'Enter at least one personal reference.';
      }
      if (isBlank(form.references.reference1Phone)) {
        return 'Enter a phone number for your first reference.';
      }
      return null;

    case 'documents': {
      const hasIdentity = NSW_APPLICATION_DOCUMENT_SLOTS.some(
        (slot) => slot.category === 'identity' && uploadedDocumentTypes.has(slot.documentType),
      );
      if (!hasIdentity) {
        return 'Upload at least one proof of identity document (section H — category A).';
      }
      const hasIncome = NSW_APPLICATION_DOCUMENT_SLOTS.some(
        (slot) => slot.category === 'income' && uploadedDocumentTypes.has(slot.documentType),
      );
      if (!hasIncome) {
        return 'Upload at least one proof of income document (section H — category B).';
      }
      const supportingPoints = NSW_APPLICATION_DOCUMENT_SLOTS.filter(
        (slot) =>
          slot.category === 'supporting' && uploadedDocumentTypes.has(slot.documentType),
      ).reduce((sum, slot) => sum + slot.points, 0);
      if (supportingPoints < 40) {
        return 'Upload supporting documents totalling at least 40 points (section H — category C).';
      }
      return null;
    }

    case 'declaration':
      if (!form.declaration.termsAccepted) {
        return 'Accept the terms and conditions to continue.';
      }
      if (isBlank(form.declaration.signatureName)) {
        return 'Enter your printed name on the declaration.';
      }
      if (isBlank(form.declaration.signatureDate)) {
        return 'Enter the declaration date.';
      }
      return null;

    default:
      return null;
  }
}

export type WizardStepId = 'applicant' | ApplicationFormStepId;

/** First wizard step that fails validation — used to jump back from Submit. */
export function findFirstInvalidWizardStep(
  applicant: ApplicantSummaryInput,
  form: NswTenancyApplicationFormData,
  uploadedDocumentTypes: Set<string>,
): { stepId: WizardStepId; error: string } | null {
  const applicantError = validateApplicantSummary(applicant);
  if (applicantError) {
    return { stepId: 'applicant', error: applicantError };
  }

  for (const step of APPLICATION_FORM_STEPS) {
    const error = validateApplicationFormStep(step.id, form, uploadedDocumentTypes);
    if (error) {
      return { stepId: step.id, error };
    }
  }

  return null;
}
