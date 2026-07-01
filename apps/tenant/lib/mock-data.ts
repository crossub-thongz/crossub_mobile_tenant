import {
  applicationDetail,
  ingoingReport,
  repairDetail,
  repairNew,
  messageDetail,
  onboardingStep,
  propertyApply,
  propertyDetail,
  rentReviewDetail,
  ROUTES,
  outgoingReport,
} from '@/constants/routes';
import { hrefWithFrom } from '@/lib/back-navigation';
import type {
  ArrearsNotice,
  FinalStatement,
  IngoingReport,
  LeaseSummary,
  ListingProperty,
  MaintenanceRequest,
  MessageThread,
  OnboardingStep,
  PendingAction,
  RenewalDecision,
  RentReceipt,
  RentReviewCase,
  RentalApplication,
  TenantLifecyclePhase,
  TenantNotification,
  VacatingCase,
} from '@/lib/types';

export const LISTING_PROPERTIES: ListingProperty[] = [
  {
    id: 'prop-101',
    address: '12 River Lane',
    suburb: 'Southbank',
    rentWeekly: 520,
    propertyType: 'Apartment',
    bedrooms: 2,
    bathrooms: 1,
    availableFrom: '2026-07-01',
    openInspectionAt: '2026-06-15T11:00:00+10:00',
    features: ['Balcony', 'Parking', 'Air conditioning'],
    imageUrl: '/placeholder-property.jpg',
  },
  {
    id: 'prop-102',
    address: '8 Oak Street',
    suburb: 'Carlton',
    rentWeekly: 680,
    propertyType: 'Townhouse',
    bedrooms: 3,
    bathrooms: 2,
    availableFrom: '2026-06-20',
    openInspectionAt: '2026-06-18T14:30:00+10:00',
    features: ['Courtyard', 'Storage', 'Near tram'],
  },
  {
    id: 'prop-103',
    address: 'Unit 4 / 55 King Rd',
    suburb: 'Clayton',
    rentWeekly: 450,
    propertyType: 'Unit',
    bedrooms: 1,
    bathrooms: 1,
    availableFrom: '2026-08-01',
    features: ['Furnished option', 'Study nook'],
  },
];

export const APPLICATIONS: RentalApplication[] = [
  {
    id: 'app-201',
    referenceNumber: 'APP-2026-0142',
    propertyId: 'prop-101',
    propertyAddress: '12 River Lane, Southbank',
    status: 'approved',
    submittedAt: '2026-05-10T09:22:00+10:00',
  },
  {
    id: 'app-202',
    referenceNumber: 'APP-2026-0198',
    propertyId: 'prop-102',
    propertyAddress: '8 Oak Street, Carlton',
    status: 'under_review',
    submittedAt: '2026-05-28T16:05:00+10:00',
  },
  {
    id: 'app-203',
    referenceNumber: 'APP-2026-0211',
    propertyId: 'prop-103',
    propertyAddress: 'Unit 4 / 55 King Rd, Clayton',
    status: 'missing_information',
    submittedAt: '2026-06-01T11:00:00+10:00',
    missingDocuments: ['Proof of income (last 2 payslips)', 'Photo ID (passport or licence)'],
  },
];

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'deposit',
    title: 'Deposit proof (2 weeks)',
    description: 'Upload proof of deposit payment. Amount and due date shown below.',
    status: 'uploaded',
    dueAt: '2026-06-05',
    amount: 1040,
    href: onboardingStep('deposit'),
  },
  {
    id: 'bond',
    title: 'Bond proof (4 weeks)',
    description:
      'Required in addition to deposit — upload bond lodgement proof (RBO or designated account).',
    status: 'pending',
    dueAt: '2026-06-08',
    amount: 2080,
    href: onboardingStep('bond'),
  },
  {
    id: 'lease_signing',
    title: 'Lease signing',
    description: 'Review and sign your lease agreement online.',
    status: 'pending',
    href: onboardingStep('lease_signing'),
  },
  {
    id: 'key_pickup',
    title: 'Key collection',
    description: 'Confirm key pickup address and time with CROSSUB / your agent.',
    status: 'pending',
    href: onboardingStep('key_pickup'),
  },
  {
    id: 'account_setup',
    title: 'App account setup',
    description: 'Confirm your profile and link your account to this lease.',
    status: 'completed',
    href: onboardingStep('account_setup'),
  },
  {
    id: 'ingoing_report',
    title: 'Ingoing report confirmation',
    description: 'Confirm each room/section of the ingoing condition report.',
    status: 'pending',
    href: hrefWithFrom(ingoingReport('ing-301'), 'onboarding'),
  },
];

export const LEASE: LeaseSummary = {
  id: 'lease-401',
  propertyAddress: '12 River Lane, Southbank VIC 3006',
  rentWeekly: 520,
  leaseStart: '2026-07-01',
  leaseEnd: '2027-06-30',
  periodic: false,
  status: 'active',
  renewalDueInDays: 88,
  documents: [
    { id: 'doc-1', name: 'Signed lease agreement.pdf', uploadedAt: '2026-06-01' },
    { id: 'doc-2', name: 'Entry condition summary.pdf', uploadedAt: '2026-06-12' },
  ],
};

export const INGOING_REPORT: IngoingReport = {
  id: 'ing-301',
  propertyAddress: '12 River Lane, Southbank',
  status: 'partially_confirmed',
  dueBy: '2026-06-20',
  confirmedCount: 3,
  sections: [
    {
      id: 'sec-lounge',
      room: 'Lounge',
      description: 'Walls good; carpet light wear near entry.',
      photos: ['lounge-1'],
      tenantConfirmed: true,
      confirmedAt: '2026-06-14T10:00:00+10:00',
    },
    {
      id: 'sec-kitchen',
      room: 'Kitchen',
      description: 'Benchtops intact; rangehood clean.',
      photos: ['kitchen-1', 'kitchen-2'],
      tenantConfirmed: true,
      confirmedAt: '2026-06-14T10:05:00+10:00',
    },
    {
      id: 'sec-bath',
      room: 'Bathroom',
      description: 'Grout discolouration near shower base.',
      photos: [],
      tenantConfirmed: false,
      tenantDispute: 'Discolouration was present at inspection — please note on record.',
    },
    {
      id: 'sec-bed1',
      room: 'Bedroom 1',
      description: 'No damage; blinds operational.',
      photos: [],
      tenantConfirmed: true,
      confirmedAt: '2026-06-15T09:00:00+10:00',
    },
    {
      id: 'sec-bed2',
      room: 'Bedroom 2',
      description: 'Minor scuff on wardrobe door interior.',
      photos: [],
      tenantConfirmed: false,
    },
  ],
};

export const MAINTENANCE: MaintenanceRequest[] = [
  {
    id: 'mnt-501',
    trackingNumber: 'MR-2026-00891',
    propertyAddress: '12 River Lane, Southbank',
    category: 'Plumbing',
    description: 'Kitchen tap dripping constantly.',
    area: 'Kitchen',
    urgency: 'normal',
    status: 'contractor_assigned',
    statusLabel: 'Contractor assigned',
    contractorName: 'QuickFix Plumbing',
    contractorPhone: '0412 345 678',
    scheduledAt: '2026-06-10T10:00:00+10:00',
    progressPercent: 55,
    createdAt: '2026-05-20T08:00:00+10:00',
    timeline: [
      { id: 't1', at: '2026-05-20T08:00:00+10:00', actor: 'You', title: 'Request submitted' },
      { id: 't2', at: '2026-05-21T11:00:00+10:00', actor: 'CROSSUB', title: 'Under review' },
      { id: 't3', at: '2026-05-22T09:30:00+10:00', actor: 'CROSSUB', title: 'Contractor assigned — QuickFix Plumbing' },
    ],
  },
  {
    id: 'mnt-502',
    trackingNumber: 'MR-2026-00904',
    propertyAddress: '12 River Lane, Southbank',
    category: 'Electrical',
    description: 'Bedroom 2 power outlet not working.',
    area: 'Bedroom 2',
    urgency: 'high',
    status: 'completed',
    statusLabel: 'Completed',
    contractorName: 'Spark Electrical',
    contractorPhone: '0423 456 789',
    progressPercent: 100,
    completionApprovalPending: true,
    tenantCompletionApproved: false,
    createdAt: '2026-05-25T14:20:00+10:00',
    timeline: [
      { id: 't1', at: '2026-05-25T14:20:00+10:00', actor: 'You', title: 'Request submitted' },
      { id: 't2', at: '2026-05-26T10:00:00+10:00', actor: 'CROSSUB', title: 'Appointment arranged — Thu 29 May 2–4pm' },
      { id: 't3', at: '2026-05-29T15:00:00+10:00', actor: 'Contractor', title: 'Repair in progress' },
    ],
  },
];

export const MESSAGE_THREADS: MessageThread[] = [
  {
    id: 'msg-600',
    subject: 'General enquiry — parking',
    type: 'general',
    category: 'leasing',
    recipient: 'agent',
    propertyAddress: '12 River Lane, Southbank',
    leaseId: 'lease-401',
    lastMessage: 'Thanks for confirming visitor parking rules.',
    lastAt: '2026-05-15T14:00:00+10:00',
    unread: 0,
    channel: 'app',
  },
  {
    id: 'msg-601',
    subject: 'Kitchen tap repair — access time',
    type: 'maintenance',
    category: 'maintenance',
    recipient: 'contractor',
    propertyAddress: '12 River Lane, Southbank',
    leaseId: 'lease-401',
    lastMessage: 'Contractor can attend Tuesday 10am–12pm. Does that work?',
    lastAt: '2026-05-28T09:15:00+10:00',
    unread: 1,
    linkedCaseId: 'mnt-501',
    channel: 'app',
    contractorEnabled: true,
    contractorName: 'QuickFix Plumbing',
  },
  {
    id: 'msg-602',
    subject: 'Rent review — proposed increase',
    type: 'rent_review',
    category: 'leasing',
    recipient: 'landlord',
    propertyAddress: '12 River Lane, Southbank',
    lastMessage: 'Please review the attached market report and respond by 15 June.',
    lastAt: '2026-05-27T16:00:00+10:00',
    unread: 1,
    linkedCaseId: 'rr-701',
    channel: 'email',
  },
  {
    id: 'msg-603',
    subject: 'June rent receipt',
    type: 'accounting',
    category: 'accounting',
    recipient: 'agent',
    propertyAddress: '12 River Lane, Southbank',
    leaseId: 'lease-401',
    lastMessage: 'Your rent receipt for June is now available in Accounting.',
    lastAt: '2026-06-01T08:00:00+10:00',
    unread: 0,
    channel: 'app',
  },
];

export const PAYMENT_PROOFS: import('@/lib/types').PaymentProofRecord[] = [
  {
    id: 'pp-dep',
    type: 'deposit',
    amount: 1040,
    uploadedAt: '2026-06-04T10:00:00+10:00',
    status: 'approved',
    fileName: 'deposit-transfer.pdf',
  },
  {
    id: 'pp-bond',
    type: 'bond',
    amount: 2080,
    status: 'pending',
  },
];

export const OUTSTANDING_BALANCE: import('@/lib/types').OutstandingBalance | null = null;

export const OUTGOING_REPORT: import('@/lib/types').OutgoingReport = {
  id: 'out-401',
  propertyAddress: '12 River Lane, Southbank',
  status: 'report_sent',
  confirmedCount: 0,
  sections: [
    {
      id: 'out-lounge',
      room: 'Lounge',
      description: 'Fair wear; carpet professionally cleaned.',
      photos: ['out-lounge'],
      tenantConfirmed: false,
    },
    {
      id: 'out-kitchen',
      room: 'Kitchen',
      description: 'Benchtops wiped; minor grease behind stove noted.',
      photos: ['out-kitchen'],
      tenantConfirmed: false,
    },
  ],
};

export const RENT_RECEIPTS: RentReceipt[] = [
  {
    id: 'rcpt-801',
    receiptNumber: 'RR-2026-06-0012',
    periodStart: '2026-06-01',
    periodEnd: '2026-06-30',
    amount: 2257.33,
    receivedAt: '2026-06-01',
    issuedAt: '2026-06-01T08:00:00+10:00',
    pdfAvailable: true,
  },
  {
    id: 'rcpt-802',
    receiptNumber: 'RR-2026-05-0098',
    periodStart: '2026-05-01',
    periodEnd: '2026-05-31',
    amount: 2257.33,
    receivedAt: '2026-05-01',
    issuedAt: '2026-05-01T08:00:00+10:00',
    pdfAvailable: true,
  },
];

export const RENT_REVIEWS: RentReviewCase[] = [
  {
    id: 'rr-701',
    propertyAddress: '12 River Lane, Southbank',
    currentRentWeekly: 520,
    proposedRentWeekly: 545,
    effectiveDate: '2026-08-01',
    explanation: 'Annual rent review based on market conditions.',
    reportAttachmentName: 'Market rent report — Southbank 2 bed.pdf',
    status: 'pending',
    counterHistory: [],
  },
];

// Demo vacating + statement (Phase 3) — visible on Vacating / Payments when enabled
export const DEMO_VACATING: VacatingCase = {
  id: 'vac-901',
  propertyAddress: '12 River Lane, Southbank',
  vacatingDate: '2027-07-15',
  status: 'open',
  outgoingStatus: 'supporting_photos_required',
  outgoingReportId: 'out-401',
};

export const DEMO_FINAL_STATEMENT: FinalStatement = {
  id: 'fs-001',
  propertyAddress: '12 River Lane, Southbank',
  totalBond: 2080,
  rentArrears: 0,
  unpaidBills: 85,
  deductions: 320,
  finalRefund: 1675,
  finalizedAt: '2027-08-01',
  pdfAvailable: true,
};

export const RENEWAL: RenewalDecision = {
  dueBy: '2026-04-02',
  leaseEnd: '2027-06-30',
  status: 'pending',
};

export const VACATING: VacatingCase | null = null;

export const FINAL_STATEMENT: FinalStatement | null = null;

/** Set true in demo to preview Phase 3 vacating + final statement flows */
export const SHOW_PHASE3_DEMO = false;

export const INSPECTIONS_LIST: import('@/lib/types').InspectionSummary[] = [
  {
    id: 'ing-301',
    type: 'ingoing',
    propertyAddress: '12 River Lane, Southbank',
    status: 'Partially confirmed',
    href: hrefWithFrom(ingoingReport('ing-301'), 'inspections'),
  },
  {
    id: 'out-401',
    type: 'outgoing',
    propertyAddress: '12 River Lane, Southbank',
    status: 'Report sent',
    href: hrefWithFrom(outgoingReport('out-401'), 'inspections'),
  },
  {
    id: 'rou-101',
    type: 'routine',
    propertyAddress: '12 River Lane, Southbank',
    status: 'Scheduled',
    scheduledAt: '2026-09-15T09:00:00+10:00',
    href: ROUTES.INSPECTIONS,
  },
];

export const TERMINATION_NOTICE: import('@/lib/types').TerminationNotice | null = null;

export const ARREARS: ArrearsNotice = {
  stage: 'late_reminder',
  outstandingAmount: 520,
  dueDate: '2026-06-08',
  message: '',
};

export const PENDING_ACTIONS: PendingAction[] = [
  {
    id: 'pa-1',
    module: 'onboarding',
    title: 'Upload bond payment proof',
    subtitle: 'Due 8 Jun · 4 weeks bond',
    status: 'Pending upload',
    priority: 'high',
    dueAt: '2026-06-08',
    href: onboardingStep('bond'),
    updatedAt: '2026-06-02T08:00:00+10:00',
  },
  {
    id: 'pa-2',
    module: 'ingoing',
    title: 'Confirm ingoing report sections',
    subtitle: '2 sections still pending · 1 dispute',
    status: 'Partially confirmed',
    priority: 'high',
    dueAt: '2026-06-20',
    href: hrefWithFrom(ingoingReport('ing-301'), 'dashboard'),
    updatedAt: '2026-06-15T09:00:00+10:00',
  },
  {
    id: 'pa-3',
    module: 'rent_review',
    title: 'Respond to rent review notice',
    subtitle: 'Proposed $545/week from 1 Aug 2026',
    status: 'Action required',
    priority: 'urgent',
    dueAt: '2026-06-15',
    href: rentReviewDetail('rr-701'),
    updatedAt: '2026-05-27T16:00:00+10:00',
  },
  {
    id: 'pa-4',
    module: 'renewal',
    title: 'Lease renewal decision (90-day notice)',
    subtitle: 'Lease ends 30 Jun 2027',
    status: 'Response due',
    priority: 'normal',
    dueAt: '2026-04-02',
    href: ROUTES.RENEWAL,
    updatedAt: '2026-06-01T08:00:00+10:00',
  },
  {
    id: 'pa-5',
    module: 'payment',
    title: 'Late rent payment',
    subtitle: 'Outstanding $520 · due 8 Jun',
    status: 'Payment reminder',
    priority: 'urgent',
    dueAt: '2026-06-08',
    href: ROUTES.PAYMENTS,
    updatedAt: '2026-06-02T08:00:00+10:00',
  },
];

export const NOTIFICATIONS: TenantNotification[] = [
  {
    id: 'n-1',
    title: 'Rent review — action required',
    body: 'Review proposed rent and respond by 15 June.',
    type: 'rent_review',
    read: false,
    href: rentReviewDetail('rr-701'),
    createdAt: '2026-05-27T16:00:00+10:00',
    actionRequired: 'Accept, reject, or counter offer',
  },
  {
    id: 'n-2',
    title: 'Ingoing report reminder',
    body: '2 sections still need your confirmation.',
    type: 'inspection',
    read: false,
    href: hrefWithFrom(ingoingReport('ing-301'), 'notifications'),
    createdAt: '2026-06-16T09:00:00+10:00',
  },
  {
    id: 'n-3',
    title: 'Rent receipt issued',
    body: 'June receipt is available to download.',
    type: 'payment',
    read: true,
    href: ROUTES.PAYMENTS,
    createdAt: '2026-06-01T08:00:00+10:00',
  },
  {
    id: 'n-4',
    title: 'Maintenance update',
    body: 'Contractor assigned for kitchen tap repair.',
    type: 'maintenance',
    read: true,
    href: repairDetail('mnt-501'),
    createdAt: '2026-05-22T09:30:00+10:00',
  },
  {
    id: 'n-5',
    title: 'Bond proof due',
    body: 'Upload bond payment proof by 8 June.',
    type: 'onboarding',
    read: false,
    href: onboardingStep('bond'),
    createdAt: '2026-06-02T08:00:00+10:00',
    actionRequired: 'Upload proof',
  },
  {
    id: 'n-6',
    title: 'Rent arrears reminder',
    body: 'Outstanding rent — please pay or contact CROSSUB.',
    type: 'payment',
    read: false,
    href: ROUTES.PAYMENTS,
    createdAt: '2026-06-02T08:00:00+10:00',
    actionRequired: 'View payment instructions',
  },
];

export const TENANT_PHASE: TenantLifecyclePhase = 'active';
