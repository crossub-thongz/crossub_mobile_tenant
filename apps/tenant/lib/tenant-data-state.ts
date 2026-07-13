import { readTenantStore } from '@/lib/tenant-store';
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
  maintenance: MaintenanceRequest[];
  applications: RentalApplication[];
  messages: MessageThread[];
  notifications: TenantNotification[];
  ingoing: IngoingReport | null;
  outgoing: OutgoingReport | null;
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
  vacating: VacatingCase | null;
}

/** Browser-persisted optimistic state before the API refresh reconciles. */
export function loadInitialState(): LoadedTenantState {
  const stored = readTenantStore();
  return {
    maintenance: stored.maintenance ?? [],
    applications: stored.applications ?? [],
    messages: stored.messages ?? [],
    notifications: stored.notifications ?? [],
    ingoing: stored.ingoingReport ?? null,
    outgoing: stored.outgoingReport ?? null,
    rentReviews: stored.rentReviews ?? [],
    vacatingState: stored.vacating?.status === 'open' ? stored.vacating : null,
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
    vacating: stored.vacating ?? null,
  };
}
