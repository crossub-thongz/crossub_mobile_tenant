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
