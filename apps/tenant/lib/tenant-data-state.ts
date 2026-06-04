import {
  APPLICATIONS,
  ARREARS,
  DEMO_FINAL_STATEMENT,
  DEMO_VACATING,
  FINAL_STATEMENT,
  INGOING_REPORT,
  INSPECTIONS_LIST,
  LEASE,
  MAINTENANCE as DEMO_MAINTENANCE,
  MESSAGE_THREADS,
  NOTIFICATIONS as DEMO_NOTIFICATIONS,
  ONBOARDING_STEPS,
  OUTGOING_REPORT,
  OUTSTANDING_BALANCE,
  PAYMENT_PROOFS,
  PENDING_ACTIONS,
  RENEWAL,
  RENT_RECEIPTS,
  RENT_REVIEWS,
  SHOW_PHASE3_DEMO,
  TERMINATION_NOTICE,
  VACATING,
} from '@/lib/mock-data';
import {
  mergeApplications,
  mergeMaintenance,
  mergeMessages,
  mergeNotifications,
  readTenantStore,
  type TenantPersistedData,
} from '@/lib/tenant-store';
import { shouldShowDemoTenancy } from '@/lib/tenant-user';
import type {
  ArrearsNotice,
  FinalStatement,
  IngoingReport,
  InspectionSummary,
  LeaseSummary,
  MaintenanceRequest,
  MessageThread,
  OnboardingStep,
  OutgoingReport,
  OutstandingBalance,
  PaymentProofRecord,
  PendingAction,
  RenewalDecision,
  RentReceipt,
  RentReviewCase,
  RentalApplication,
  TenantNotification,
  VacatingCase,
  TerminationNotice,
} from '@/lib/types';

export interface LoadedTenantState {
  showDemoTenancy: boolean;
  maintenance: MaintenanceRequest[];
  applications: RentalApplication[];
  messages: MessageThread[];
  notifications: TenantNotification[];
  ingoing: IngoingReport | null;
  outgoing: OutgoingReport;
  rentReviews: RentReviewCase[];
  vacatingState: VacatingCase | null;
  lease: LeaseSummary | null;
  rentReceipts: RentReceipt[];
  arrears: ArrearsNotice | null;
  outstandingBalance: OutstandingBalance | null;
  paymentProofs: PaymentProofRecord[];
  onboardingSteps: OnboardingStep[];
  pendingActions: PendingAction[];
  inspections: InspectionSummary[];
  renewal: RenewalDecision | null;
  terminationNotice: TerminationNotice | null;
  finalStatement: FinalStatement | null;
  showPhase3Demo: boolean;
  vacating: VacatingCase | null;
}

function mergeRentReceipts(
  seed: RentReceipt[],
  persisted: RentReceipt[] | undefined,
): RentReceipt[] {
  if (!persisted?.length) return seed;
  const seedIds = new Set(seed.map((r) => r.id));
  const added = persisted.filter((r) => !seedIds.has(r.id));
  return [...added, ...seed];
}

export function loadTenantState(
  userId: string | null,
  authed: boolean,
  demoEnv: boolean,
  email?: string | null,
): LoadedTenantState {
  const stored = readTenantStore(userId);
  const showDemoTenancy = shouldShowDemoTenancy(userId, authed, demoEnv, email);

  if (!showDemoTenancy) {
    return {
      showDemoTenancy: false,
      maintenance: stored.maintenance,
      applications: stored.applications,
      messages: stored.messages,
      notifications: stored.notifications,
      ingoing: stored.ingoingReport,
      outgoing:
        stored.outgoingReport ??
        ({
          id: 'out-empty',
          propertyAddress: '—',
          status: 'report_sent',
          sections: [],
          confirmedCount: 0,
        } as OutgoingReport),
      rentReviews: stored.rentReviews,
      vacatingState: stored.vacating,
      lease: null,
      rentReceipts: stored.rentReceipts ?? [],
      arrears: stored.arrears ?? null,
      outstandingBalance: stored.outstandingBalance ?? null,
      paymentProofs: [],
      onboardingSteps: [],
      pendingActions: [],
      inspections: [],
      renewal: null,
      terminationNotice: null,
      finalStatement: null,
      showPhase3Demo: false,
      vacating: stored.vacating,
    };
  }

  return {
    showDemoTenancy: true,
    maintenance: mergeMaintenance(DEMO_MAINTENANCE, stored.maintenance),
    applications: mergeApplications(APPLICATIONS, stored.applications),
    messages: mergeMessages(MESSAGE_THREADS, stored.messages),
    notifications: mergeNotifications(DEMO_NOTIFICATIONS, stored.notifications),
    ingoing: stored.ingoingReport ?? INGOING_REPORT,
    outgoing: stored.outgoingReport ?? OUTGOING_REPORT,
    rentReviews: stored.rentReviews.length ? stored.rentReviews : RENT_REVIEWS,
    vacatingState: stored.vacating ?? VACATING,
    lease: LEASE,
    rentReceipts: mergeRentReceipts(RENT_RECEIPTS, stored.rentReceipts),
    arrears: stored.arrears !== undefined ? stored.arrears : ARREARS,
    outstandingBalance:
      stored.outstandingBalance !== undefined
        ? stored.outstandingBalance
        : OUTSTANDING_BALANCE,
    paymentProofs: PAYMENT_PROOFS,
    onboardingSteps: ONBOARDING_STEPS,
    pendingActions: PENDING_ACTIONS,
    inspections: INSPECTIONS_LIST,
    renewal: RENEWAL,
    terminationNotice: TERMINATION_NOTICE,
    finalStatement: SHOW_PHASE3_DEMO ? DEMO_FINAL_STATEMENT : FINAL_STATEMENT,
    showPhase3Demo: SHOW_PHASE3_DEMO,
    vacating: SHOW_PHASE3_DEMO ? DEMO_VACATING : stored.vacating ?? VACATING,
  };
}

