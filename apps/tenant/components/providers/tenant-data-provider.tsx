'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useAuth } from '@/components/providers/auth-provider';
import {
  createTenantMessageThread,
  fetchLedger,
  fetchMaintenanceRequests,
  approveMaintenanceCompletion,
  respondToMaintenanceSchedule,
  respondMaintenanceResponsibilityAck,
  fetchTenancies,
  fetchTenantApplications,
  fetchTenantDocuments,
  fetchTenantInspections,
  fetchTenantIngoingInspection,
  fetchTenantIngoingInspections,
  fetchTenantOutgoingInspection,
  fetchTenantOutgoingInspections,
  fetchTenantRoutineInspection,
  fetchTenantRoutineInspections,
  fetchTenantMessages,
  fetchTenantNewLeasingCases,
  fetchTenantNotifications,
  fetchTenantProperties,
  fetchTenantRentReviews,
  fetchTenantVacatingCases,
  markTenantMessageThreadRead,
  submitTenantRentReviewResponse,
  signTenantRentReviewLeaseAgreement,
  acceptTenantVacatingSettlement,
  declineTenantVacatingSettlement,
  createTenantVacatingCase,
  cancelTenantVacatingCase,
  updateTenantVacateDate,
  markTenantNotificationRead,
  replyToTenantMessageThread,
  approveTenantIngoingInspection,
  rejectTenantIngoingInspection,
  submitTenantIngoingSectionFeedback,
  approveTenantOutgoingInspection,
  disputeTenantOutgoingSection,
} from '@/lib/crossub-api/tenant-account-client';
import type { TenantRoutineInspection } from '@/lib/crossub-api/tenant-account-client';
import {
  categoryToDepartment,
  toLeaseSummary,
  toMessageThreads,
  toRentPaymentReceipts,
  toIngoingReport,
  toIngoingReportSummaries,
  toOutgoingReport,
  toOutgoingReportSummaries,
  toRoutineInspectionSummaries,
  toTenantApplications,
  toTenantDocuments,
  toTenantInspections,
  toTenantMaintenanceRequests,
  toTenantNotifications,
  toTenantNewLeasingCases,
  toTenantRentReviews,
  pickActiveVacatingCase,
  pickDisplayVacatingCase,
  toTenantVacatingCases,
  readTenantPropertyMessageContacts,
  type TenantDocumentView,
} from '@/lib/crossub-api/tenant-mappers';
import { resolveTenantPropertyContacts } from '@/lib/tenant-message-recipients';
import { VACATING_STAGE } from '@/constants/vacating';
import { fetchPublicListings } from '@/lib/crossub-api/public-listings-client';
import {
  fetchLeasingOnboarding,
  mapLeasingOnboardingToSteps,
  type TenantLeasingOnboardingDto,
} from '@/lib/crossub-api/tenant-leasing-client';
import { LIVE_POLL_MS } from '@/lib/live-sync';
import { categoryToMessageType } from '@/lib/message-categories';
import { loadInitialState, type LoadedTenantState } from '@/lib/tenant-data-state';
import {
  nextApplicationRef,
  nextTrackingNumber,
  patchTenantStore,
  readTenantStore,
} from '@/lib/tenant-store';
import type {
  ArrearsNotice,
  FinalStatement,
  IngoingReport,
  InspectionSummary,
  LeaseSummary,
  MaintenanceRequest,
  MaintenancePropertyContact,
  MessageCategory,
  MessageParty,
  MessageThread,
  NewLeasingCase,
  ThreadMessage,
  OnboardingStep,
  OutgoingReport,
  OutstandingBalance,
  PaymentProofRecord,
  PendingAction,
  Priority,
  RenewalDecision,
  RentReceipt,
  RentReviewCase,
  RentalApplication,
  TenantLifecyclePhase,
  TenantNotification,
  VacatingCase,
  TerminationNotice,
} from '@/lib/types';

export interface NewRepairInput {
  category: string;
  description: string;
  area?: string;
  urgency: Priority;
  propertyAddress?: string;
  /**
   * Server-assigned id/tracking from a successful real `POST /tenant/maintenance-requests`.
   * When present, the optimistic card uses them so the next `refresh()` reconciles to the
   * same row (no duplicate).
   */
  id?: string;
  trackingNumber?: string;
  photos?: string[];
}

export interface NewApplicationInput {
  propertyId: string;
  propertyAddress: string;
}

export interface NewMessageInput {
  subject: string;
  body: string;
  category: MessageCategory;
  recipient: MessageParty;
  contractorName?: string;
}

export interface RecordRentPaymentInput {
  amount: number;
  method: 'bank_transfer' | 'card';
}

interface TenantDataContextValue {
  loading: boolean;
  apiConnected: boolean;
  /**
   * True when the API responded but the TENANT user has no Person/application
   * anchor yet (typical 403 from tenant facades). Distinct from a network outage.
   */
  profileUnlinked: boolean;
  phase: TenantLifecyclePhase;
  refresh: () => Promise<void>;
  pendingActions: PendingAction[];
  notifications: TenantNotification[];
  listings: ListingProperty[];
  listingsLoading: boolean;
  listingsError: string | null;
  applications: RentalApplication[];
  newLeasingCases: NewLeasingCase[];
  onboardingSteps: OnboardingStep[];
  leasingOnboarding: TenantLeasingOnboardingDto | null;
  refreshLeasingOnboarding: () => Promise<void>;
  lease: LeaseSummary | null;
  ingoingReport: IngoingReport | null;
  ingoingInspections: IngoingReport[];
  outgoingReport: OutgoingReport | null;
  outgoingInspections: OutgoingReport[];
  routineInspections: TenantRoutineInspection[];
  maintenance: MaintenanceRequest[];
  messages: MessageThread[];
  /** Strata / building manager contacts for the leased property (when on file). */
  propertyContacts: {
    strataContact?: MaintenancePropertyContact;
    buildingManager?: MaintenancePropertyContact;
  };
  rentReceipts: RentReceipt[];
  rentReviews: RentReviewCase[];
  renewal: RenewalDecision | null;
  /** Open vacating case only — used for hub badges and active workflows. */
  vacating: VacatingCase | null;
  /** Open or latest withdrawn case — drives the Vacating page (Deleted tag). */
  vacatingCase: VacatingCase | null;
  finalStatement: FinalStatement | null;
  arrears: ArrearsNotice | null;
  paymentProofs: PaymentProofRecord[];
  outstandingBalance: OutstandingBalance | null;
  inspections: InspectionSummary[];
  terminationNotice: TerminationNotice | null;
  storedDocuments: TenantDocumentView[];
  addRepair: (input: NewRepairInput) => MaintenanceRequest;
  addApplication: (input: NewApplicationInput) => RentalApplication;
  addMessageThread: (input: NewMessageInput) => MessageThread;
  getThreadMessages: (threadId: string) => ThreadMessage[];
  sendThreadMessage: (threadId: string, body: string, to: MessageParty) => void;
  markThreadRead: (threadId: string) => void;
  recordRentPayment: (input: RecordRentPaymentInput) => RentReceipt;
  approveRepairCompletion: (id: string) => Promise<void>;
  respondToMaintenanceSchedule: (
    id: string,
    decision: 'approved' | 'declined',
    declineReason?: string,
  ) => Promise<void>;
  respondMaintenanceResponsibilityAck: (
    id: string,
    agreed: boolean,
    reason?: string,
  ) => Promise<void>;
  recordVacatingDate: (date: string) => void;
  startVacating: (date: string, reason?: string) => Promise<void>;
  cancelVacatingCase: (reason?: string) => Promise<void>;
  updateVacateDate: (date: string) => Promise<void>;
  acceptVacatingSettlement: (caseId: string) => Promise<void>;
  declineVacatingSettlement: (caseId: string, reason: string) => Promise<void>;
  markNotificationRead: (id: string) => void;
  confirmIngoingSection: (
    sectionId: string,
    options?: { dispute?: string; feedback?: string; inspectionId?: string },
  ) => Promise<void>;
  approveIngoingReport: (inspectionId?: string) => Promise<void>;
  rejectIngoingReport: (reason: string, inspectionId?: string) => Promise<void>;
  confirmOutgoingSection: (sectionId: string, dispute?: string) => Promise<void>;
  respondRentReview: (
    id: string,
    action: 'accept' | 'reject' | 'counter',
    payload?: { amount?: number; moveOutDate?: string; reason?: string },
  ) => Promise<void>;
  signLeaseAgreement: (reviewId: string) => Promise<void>;
}

type ListingProperty = import('@/lib/types').ListingProperty;

const TenantDataContext = createContext<TenantDataContextValue | null>(null);

function applyLoadedState(
  loaded: LoadedTenantState,
  setters: {
    setMaintenance: (v: MaintenanceRequest[]) => void;
    setApplications: (v: RentalApplication[]) => void;
    setMessages: (v: MessageThread[]) => void;
    setNotifications: (v: TenantNotification[]) => void;
    setIngoing: (v: IngoingReport | null) => void;
    setOutgoing: (v: OutgoingReport | null) => void;
    setRentReviews: (v: RentReviewCase[]) => void;
    setVacatingState: (v: VacatingCase | null) => void;
    setLease: (v: LeaseSummary | null) => void;
    setRentReceipts: (v: RentReceipt[]) => void;
    setArrears: (v: ArrearsNotice | null) => void;
    setOutstandingBalance: (v: OutstandingBalance | null) => void;
    setPaymentProofs: (v: PaymentProofRecord[]) => void;
    setOnboardingSteps: (v: OnboardingStep[]) => void;
    setPendingActions: (v: PendingAction[]) => void;
    setInspections: (v: InspectionSummary[]) => void;
    setRenewal: (v: RenewalDecision | null) => void;
    setTerminationNotice: (v: TerminationNotice | null) => void;
    setFinalStatement: (v: FinalStatement | null) => void;
    setVacatingDisplay: (v: VacatingCase | null) => void;
  },
) {
  setters.setMaintenance(loaded.maintenance);
  setters.setApplications(loaded.applications);
  setters.setMessages(loaded.messages);
  setters.setNotifications(loaded.notifications);
  setters.setIngoing(loaded.ingoing);
  setters.setOutgoing(loaded.outgoing);
  setters.setRentReviews(loaded.rentReviews);
  setters.setVacatingState(loaded.vacatingState);
  setters.setLease(loaded.lease);
  setters.setRentReceipts(loaded.rentReceipts);
  setters.setArrears(loaded.arrears);
  setters.setOutstandingBalance(loaded.outstandingBalance);
  setters.setPaymentProofs(loaded.paymentProofs);
  setters.setOnboardingSteps(loaded.onboardingSteps);
  setters.setPendingActions(loaded.pendingActions);
  setters.setInspections(loaded.inspections);
  setters.setRenewal(loaded.renewal);
  setters.setTerminationNotice(loaded.terminationNotice);
  setters.setFinalStatement(loaded.finalStatement);
  setters.setVacatingDisplay(loaded.vacating);
}

function isForbiddenRejection(reason: unknown): boolean {
  if (!reason || typeof reason !== 'object') return false;
  const record = reason as {
    status?: number;
    response?: { status?: number };
    message?: string;
  };
  if (record.status === 403 || record.response?.status === 403) return true;
  const message = typeof record.message === 'string' ? record.message : '';
  return /not linked to a tenant profile|403|forbidden/i.test(message);
}

export function TenantDataProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();

  const [loading, setLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);
  const [profileUnlinked, setProfileUnlinked] = useState(false);
  const [notifications, setNotifications] = useState<TenantNotification[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [leasedPropertyContacts, setLeasedPropertyContacts] = useState<{
    strataContact?: MaintenancePropertyContact;
    buildingManager?: MaintenancePropertyContact;
  }>({});
  const [applications, setApplications] = useState<RentalApplication[]>([]);
  const [newLeasingCases, setNewLeasingCases] = useState<NewLeasingCase[]>([]);
  const [messages, setMessages] = useState<MessageThread[]>([]);
  // Live-mode per-thread message history (keyed by thread id, incl. optimistic temp ids).
  const [threadMessagesById, setThreadMessagesById] = useState<
    Record<string, ThreadMessage[]>
  >({});
  const [ingoing, setIngoing] = useState<IngoingReport | null>(null);
  const [ingoingInspections, setIngoingInspections] = useState<IngoingReport[]>([]);
  const [outgoing, setOutgoing] = useState<OutgoingReport | null>(null);
  const [outgoingInspections, setOutgoingInspections] = useState<OutgoingReport[]>([]);
  const [routineInspections, setRoutineInspections] = useState<TenantRoutineInspection[]>([]);
  const [rentReviews, setRentReviews] = useState<RentReviewCase[]>([]);
  const [vacatingState, setVacatingState] = useState<VacatingCase | null>(null);
  const [vacatingDisplay, setVacatingDisplay] = useState<VacatingCase | null>(null);
  const [lease, setLease] = useState<LeaseSummary | null>(null);
  const [rentReceipts, setRentReceipts] = useState<RentReceipt[]>([]);
  const [arrears, setArrears] = useState<ArrearsNotice | null>(null);
  const [outstandingBalance, setOutstandingBalance] =
    useState<OutstandingBalance | null>(null);
  const [paymentProofs, setPaymentProofs] = useState<PaymentProofRecord[]>([]);
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([]);
  const [leasingOnboarding, setLeasingOnboarding] =
    useState<TenantLeasingOnboardingDto | null>(null);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  // Live-mode documents from the API.
  const [apiDocuments, setApiDocuments] = useState<TenantDocumentView[] | null>(
    null,
  );
  const [renewal, setRenewal] = useState<RenewalDecision | null>(null);
  const [terminationNotice, setTerminationNotice] = useState<TerminationNotice | null>(null);
  const [finalStatement, setFinalStatement] = useState<FinalStatement | null>(null);
  const [listings, setListings] = useState<ListingProperty[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsError, setListingsError] = useState<string | null>(null);
  const hasLoadedOnceRef = useRef(false);

  const setters = useMemo(
    () => ({
      setMaintenance,
      setApplications,
      setMessages,
      setNotifications,
      setIngoing,
      setOutgoing,
      setRentReviews,
      setVacatingState,
      setLease,
      setRentReceipts,
      setArrears,
      setOutstandingBalance,
      setPaymentProofs,
      setOnboardingSteps,
      setPendingActions,
      setInspections,
      setRenewal,
      setTerminationNotice,
      setFinalStatement,
      setVacatingDisplay,
    }),
    [],
  );

  const hydrate = useCallback(() => {
    applyLoadedState(loadInitialState(), setters);
  }, [setters]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    let cancelled = false;
    setListingsLoading(true);
    setListingsError(null);
    void fetchPublicListings()
      .then((items) => {
        if (!cancelled) setListings(items);
      })
      .catch((err) => {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Failed to load property listings';
          setListingsError(message);
          setListings([]);
        }
      })
      .finally(() => {
        if (!cancelled) setListingsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persistMaintenance = useCallback((next: MaintenanceRequest[]) => {
    patchTenantStore({ maintenance: next });
  }, []);

  const loadLeasingOnboarding = useCallback(async () => {
    try {
      const dto = await fetchLeasingOnboarding();
      setLeasingOnboarding(dto);
      setOnboardingSteps(mapLeasingOnboardingToSteps(dto));
      return true;
    } catch {
      setLeasingOnboarding(null);
      return false;
    }
  }, []);

  const refreshLeasingOnboarding = useCallback(async () => {
    await loadLeasingOnboarding();
  }, [loadLeasingOnboarding]);

  /** Lightweight poll for dispatched rent-review notices, messages, and unread alerts. */
  const syncLiveAttention = useCallback(async () => {
    if (status !== 'authed') return;
    const [notifs, rentReviewsRes, threadsRes] = await Promise.allSettled([
      fetchTenantNotifications(),
      fetchTenantRentReviews(),
      fetchTenantMessages(),
    ]);
    if (notifs.status === 'fulfilled') {
      setNotifications(toTenantNotifications(notifs.value));
    }
    if (rentReviewsRes.status === 'fulfilled') {
      setRentReviews(toTenantRentReviews(rentReviewsRes.value));
    }
    if (threadsRes.status === 'fulfilled') {
      const { threads: mapped, messagesById } = toMessageThreads(threadsRes.value);
      setMessages(mapped);
      setThreadMessagesById(messagesById);
    }
  }, [status]);

  /** Poll maintenance list without a full app refresh (status, ack, photos, etc.). */
  const syncMaintenanceRequests = useCallback(async () => {
    if (status !== 'authed' || !apiConnected) return;
    try {
      const requests = await fetchMaintenanceRequests();
      const fromApi = toTenantMaintenanceRequests(requests, lease?.propertyAddress);
      const apiIds = new Set(fromApi.map((r) => r.id));
      const localOnly = readTenantStore().maintenance.filter((m) => !apiIds.has(m.id));
      setMaintenance([...localOnly, ...fromApi]);
    } catch {
      // keep last good snapshot
    }
  }, [status, apiConnected, lease?.propertyAddress]);

  /** Poll routine self-inspections (decline, approval, action required). */
  const syncRoutineInspections = useCallback(async () => {
    if (status !== 'authed' || !apiConnected) return;
    try {
      const rows = await fetchTenantRoutineInspections();
      setRoutineInspections(rows);
    } catch {
      // keep last good snapshot
    }
  }, [status, apiConnected]);

  const refresh = useCallback(async (options?: { force?: boolean }) => {
    const isInitialLoad = !hasLoadedOnceRef.current;
    const force = options?.force === true;
    const showBlockingLoad = isInitialLoad || force;

    if (status !== 'authed') {
      hasLoadedOnceRef.current = false;
      if (showBlockingLoad) {
        setApiConnected(false);
        setProfileUnlinked(false);
        setLoading(false);
      }
      return;
    }

    let loaded: LoadedTenantState | undefined;
    if (showBlockingLoad) {
      setLoading(true);
      loaded = loadInitialState();
      applyLoadedState(loaded, setters);
    }

    // Pull every facade-backed screen (lease, ledger, repairs, messages, notifications) in
    // parallel. A 403 (tenant not yet linked to a Person/tenancy) or a network error on any
    // one leaves that screen on its seed data — the app stays usable rather than going blank.
    const [
      tenancies,
      ledger,
      requests,
      threads,
      notifs,
      inspectionsRes,
      documentsRes,
      applicationsRes,
      newLeasingRes,
      ingoingInspectionsRes,
      outgoingInspectionsRes,
      routineInspectionsRes,
      rentReviewsRes,
      vacatingCasesRes,
      propertiesRes,
    ] = await Promise.allSettled([
      fetchTenancies(),
      fetchLedger(),
      fetchMaintenanceRequests(),
      fetchTenantMessages(),
      fetchTenantNotifications(),
      fetchTenantInspections(),
      fetchTenantDocuments(),
      fetchTenantApplications(),
      fetchTenantNewLeasingCases(),
      fetchTenantIngoingInspections(),
      fetchTenantOutgoingInspections(),
      fetchTenantRoutineInspections(),
      fetchTenantRentReviews(),
      fetchTenantVacatingCases(),
      fetchTenantProperties(),
    ]);

    let connected = false;
    let sawForbidden = false;
    const noteRejection = (result: PromiseSettledResult<unknown>) => {
      if (result.status === 'rejected' && isForbiddenRejection(result.reason)) {
        sawForbidden = true;
      }
    };

    if (tenancies.status === 'fulfilled') {
      connected = true;
      // Powers both the Lease and Property screens (both read `lease`).
      setLease(toLeaseSummary(tenancies.value));
    } else {
      noteRejection(tenancies);
    }

    if (ledger.status === 'fulfilled') {
      connected = true;
      setRentReceipts(toRentPaymentReceipts(ledger.value));
      // The thin ledger carries no reliable arrears signal, so clear the seed banners
      // rather than show demo arrears alongside real payments.
      setArrears(null);
      setOutstandingBalance(null);
    } else {
      noteRejection(ledger);
    }

    if (requests.status === 'fulfilled') {
      connected = true;
      const fromApi = toTenantMaintenanceRequests(
        requests.value,
        loaded?.lease?.propertyAddress,
      );
      // Keep the tenant's own locally-created (optimistic) repairs, drop demo seeds.
      const apiIds = new Set(fromApi.map((r) => r.id));
      const localOnly = readTenantStore().maintenance.filter(
        (m) => !apiIds.has(m.id),
      );
      setMaintenance([...localOnly, ...fromApi]);
    } else {
      noteRejection(requests);
    }

    if (propertiesRes.status === 'fulfilled') {
      connected = true;
      setLeasedPropertyContacts(
        readTenantPropertyMessageContacts(propertiesRes.value[0]),
      );
    } else {
      noteRejection(propertiesRes);
    }

    if (threads.status === 'fulfilled') {
      connected = true;
      // Real threads REPLACE the demo inbox (the API list carries each thread's full
      // message history, so both the inbox and each detail are filled from one fetch).
      const { threads: mapped, messagesById } = toMessageThreads(threads.value);
      setMessages(mapped);
      setThreadMessagesById(messagesById);
    } else {
      noteRejection(threads);
    }

    if (notifs.status === 'fulfilled') {
      connected = true;
      // Real notifications REPLACE the demo list.
      setNotifications(toTenantNotifications(notifs.value));
    } else {
      noteRejection(notifs);
    }

    if (inspectionsRes.status === 'fulfilled') {
      connected = true;
      const fromApi = toTenantInspections(inspectionsRes.value).filter(
        (i) => i.type !== 'routine',
      );
      setInspections(fromApi);
    } else {
      noteRejection(inspectionsRes);
    }

    if (documentsRes.status === 'fulfilled') {
      connected = true;
      // Real documents REPLACE the derived (mock) storedDocuments list.
      setApiDocuments(toTenantDocuments(documentsRes.value));
    } else {
      noteRejection(documentsRes);
    }

    if (applicationsRes.status === 'fulfilled') {
      connected = true;
      // Real applications REPLACE the demo list (agent-opened new-leasing only).
      setApplications(toTenantApplications(applicationsRes.value));
    } else {
      noteRejection(applicationsRes);
    }

    if (newLeasingRes.status === 'fulfilled') {
      connected = true;
      setNewLeasingCases(toTenantNewLeasingCases(newLeasingRes.value));
    } else {
      noteRejection(newLeasingRes);
    }

    if (ingoingInspectionsRes.status === 'fulfilled') {
      connected = true;
      const summaries = toIngoingReportSummaries(ingoingInspectionsRes.value);
      setIngoingInspections(summaries);
      const urgent = summaries.find((r) => r.status !== 'confirmed');
      if (urgent) {
        try {
          const detail = await fetchTenantIngoingInspection(urgent.id);
          setIngoing(toIngoingReport(detail));
        } catch {
          setIngoing(urgent);
        }
      } else {
        setIngoing(null);
      }
    } else {
      noteRejection(ingoingInspectionsRes);
    }

    if (outgoingInspectionsRes.status === 'fulfilled') {
      connected = true;
      const summaries = toOutgoingReportSummaries(outgoingInspectionsRes.value);
      setOutgoingInspections(summaries);
      const urgent = summaries.find(
        (r) => r.status !== 'confirmed' && r.status !== 'finalized',
      );
      if (urgent) {
        try {
          const detail = await fetchTenantOutgoingInspection(urgent.id);
          setOutgoing(toOutgoingReport(detail));
        } catch {
          setOutgoing(urgent);
        }
      } else {
        setOutgoing(null);
      }
    } else {
      noteRejection(outgoingInspectionsRes);
    }

    if (routineInspectionsRes.status === 'fulfilled') {
      connected = true;
      setRoutineInspections(routineInspectionsRes.value);
    } else {
      noteRejection(routineInspectionsRes);
    }

    if (rentReviewsRes.status === 'fulfilled') {
      connected = true;
      // Real rent reviews REPLACE the demo list (only agent-dispatched notices).
      setRentReviews(toTenantRentReviews(rentReviewsRes.value));
    } else {
      noteRejection(rentReviewsRes);
    }

    if (vacatingCasesRes.status === 'fulfilled') {
      connected = true;
      const mapped = toTenantVacatingCases(vacatingCasesRes.value);
      const primary = pickDisplayVacatingCase(mapped);
      setVacatingState(pickActiveVacatingCase(mapped));
      setVacatingDisplay(primary);
      patchTenantStore({ vacating: pickActiveVacatingCase(mapped) });
    } else {
      noteRejection(vacatingCasesRes);
    }

    if (await loadLeasingOnboarding()) {
      connected = true;
    }

    setApiConnected(connected);
    setProfileUnlinked(!connected && sawForbidden);
    hasLoadedOnceRef.current = true;
    if (showBlockingLoad) {
      setLoading(false);
    }
  }, [status, setters, loadLeasingOnboarding]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Background sync for rent-review notices and maintenance jobs — do not call full
  // refresh (it used to wipe lease state from localStorage and flash the property page).
  useEffect(() => {
    if (status !== 'authed' || !apiConnected) return;
    const tick = () => {
      void syncLiveAttention();
      void syncMaintenanceRequests();
      void syncRoutineInspections();
    };
    void tick();
    const id = window.setInterval(tick, LIVE_POLL_MS);
    return () => window.clearInterval(id);
  }, [status, apiConnected, syncLiveAttention, syncMaintenanceRequests, syncRoutineInspections]);

  const onboardingPendingAgent = useMemo(
    () => onboardingSteps.some((s) => s.status === 'uploaded'),
    [onboardingSteps],
  );

  // Poll leasing onboarding while the tenant is waiting on agent approval (deposit/bond/agreement).
  useEffect(() => {
    if (status !== 'authed' || !apiConnected || !leasingOnboarding || !onboardingPendingAgent) {
      return;
    }
    const id = window.setInterval(() => {
      void loadLeasingOnboarding();
    }, LIVE_POLL_MS);
    return () => window.clearInterval(id);
  }, [
    status,
    apiConnected,
    leasingOnboarding,
    onboardingPendingAgent,
    loadLeasingOnboarding,
  ]);

  // Refresh attention items and repairs when the tenant returns to this tab.
  useEffect(() => {
    if (status !== 'authed' || !apiConnected) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void syncLiveAttention();
        void syncMaintenanceRequests();
        void syncRoutineInspections();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [status, apiConnected, syncLiveAttention, syncMaintenanceRequests, syncRoutineInspections]);

  const propertyAddress = lease?.propertyAddress ?? 'Your property';
  const leaseId = lease?.id;

  const addRepair = useCallback(
    (input: NewRepairInput): MaintenanceRequest => {
      const createdAt = new Date().toISOString();
      const item: MaintenanceRequest = {
        id: input.id ?? `repair-${Date.now()}`,
        trackingNumber: input.trackingNumber ?? nextTrackingNumber(),
        propertyAddress: input.propertyAddress ?? propertyAddress,
        category: input.category,
        description: input.description,
        area: input.area ?? '',
        urgency: input.urgency,
        status: 'submitted',
        statusLabel: 'Submitted',
        progressPercent: 10,
        createdAt,
        timeline: [
          {
            id: `tl-${Date.now()}`,
            at: createdAt,
            actor: 'You',
            title: 'Request submitted',
          },
        ],
        photos: input.photos ?? [],
        completionEvidenceUrls: [],
        completionEvidenceUploaded: false,
        completionApprovalPending: false,
        tenantCompletionApproved: false,
      };
      setMaintenance((prev) => {
        const next = [item, ...prev];
        persistMaintenance(next);
        return next;
      });
      return item;
    },
    [persistMaintenance, propertyAddress],
  );

  const addApplication = useCallback(
    (input: NewApplicationInput): RentalApplication => {
      const item: RentalApplication = {
        id: `app-${Date.now()}`,
        referenceNumber: nextApplicationRef(),
        propertyId: input.propertyId,
        propertyAddress: input.propertyAddress,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
      };
      setApplications((prev) => {
        const next = [item, ...prev];
        patchTenantStore( { applications: next });
        return next;
      });
      return item;
    },
    [],
  );

  const getThreadMessages = useCallback(
    (threadId: string): ThreadMessage[] => threadMessagesById[threadId] ?? [],
    [threadMessagesById],
  );

  const sendThreadMessage = useCallback(
    (threadId: string, body: string, to: MessageParty) => {
      const trimmed = body.trim();
      if (!trimmed) return;
      const now = new Date().toISOString();
      const outbound: ThreadMessage = {
        id: `tm-${Date.now()}`,
        at: now,
        direction: 'outbound',
        party: to,
        fromName: 'You',
        body: trimmed,
        channel: 'app',
      };

      setThreadMessagesById((prev) => ({
        ...prev,
        [threadId]: [...(prev[threadId] ?? []), outbound],
      }));
      setMessages((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? { ...t, lastMessage: trimmed, lastAt: now, unread: 0 }
            : t,
        ),
      );
      const thread = messages.find((m) => m.id === threadId);
      const realId = thread?.serverThreadId ?? threadId;
      void replyToTenantMessageThread(realId, { body: trimmed })
        .then((updated) => {
          const { messagesById } = toMessageThreads([updated]);
          setThreadMessagesById((prev) => ({
            ...prev,
            [threadId]: messagesById[updated.id] ?? prev[threadId],
          }));
        })
        .catch(() => {
          /* keep the optimistic message; a later refresh reconciles */
        });
    },
    [messages],
  );

  const markThreadRead = useCallback(
    (threadId: string) => {
      const thread = messages.find((m) => m.id === threadId);
      const realId = thread?.serverThreadId ?? threadId;

      setMessages((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, unread: 0 } : t)),
      );

      if (apiConnected && realId) {
        void markTenantMessageThreadRead(realId).catch(() => {});
      }
    },
    [messages, apiConnected],
  );

  const addMessageThread = useCallback(
    (input: NewMessageInput): MessageThread => {
      const now = new Date().toISOString();
      const trimmedBody = input.body.trim();
      const id = `msg-${Date.now()}`;
      const item: MessageThread = {
        id,
        subject: input.subject.trim(),
        type: categoryToMessageType(input.category),
        category: input.category,
        recipient: input.recipient,
        propertyAddress: lease?.propertyAddress,
        leaseId: leaseId ?? undefined,
        lastMessage: trimmedBody,
        lastAt: now,
        unread: 0,
        channel: 'app',
        contractorEnabled:
          input.recipient === 'contractor' || input.category === 'maintenance',
        contractorName:
          input.recipient === 'contractor' ? input.contractorName : undefined,
      };
      const outbound: ThreadMessage = {
        id: `tm-${Date.now()}`,
        at: now,
        direction: 'outbound',
        party: input.recipient,
        fromName: 'You',
        body: trimmedBody,
        channel: 'app',
      };

      setMessages((prev) => [item, ...prev]);
      setThreadMessagesById((prev) => ({ ...prev, [id]: [outbound] }));
      void createTenantMessageThread({
        subject: item.subject,
        body: trimmedBody,
        department: categoryToDepartment(input.category),
      })
        .then((created) => {
          setMessages((prev) =>
            prev.map((t) =>
              t.id === id
                ? { ...t, serverThreadId: created.id, lastAt: created.lastAt ?? t.lastAt }
                : t,
            ),
          );
          const { messagesById } = toMessageThreads([created]);
          setThreadMessagesById((prev) => ({
            ...prev,
            [id]: messagesById[created.id] ?? prev[id],
          }));
        })
        .catch(() => {
          /* keep optimistic; a later refresh reconciles */
        });
      return item;
    },
    [lease, leaseId],
  );

  const recordRentPayment = useCallback(
    (input: RecordRentPaymentInput): RentReceipt => {
      const now = new Date();
      const periodEnd = now.toISOString().slice(0, 10);
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      const receipt: RentReceipt = {
        id: `rcpt-${Date.now()}`,
        receiptNumber: `RR-${now.getFullYear()}-${String(Date.now()).slice(-4)}`,
        periodStart,
        periodEnd,
        amount: input.amount,
        receivedAt: now.toISOString(),
        issuedAt: now.toISOString(),
        pdfAvailable: true,
      };
      setRentReceipts((prev) => {
        const next = [receipt, ...prev];
        patchTenantStore( {
          rentReceipts: next,
          arrears: null,
          outstandingBalance: null,
        });
        return next;
      });
      setArrears(null);
      setOutstandingBalance(null);
      return receipt;
    },
    [],
  );

  const markNotificationRead = useCallback(
    (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      void markTenantNotificationRead(id).catch(() => {});
    },
    [],
  );

  const confirmIngoingSection = useCallback(
    async (
      sectionId: string,
      options?: { dispute?: string; feedback?: string; inspectionId?: string },
    ) => {
      const targetId = options?.inspectionId ?? ingoing?.id;
      if (!targetId) return;
      const dispute = options?.dispute?.trim();
      const feedback = options?.feedback?.trim();

      if (!apiConnected) {
        setIngoing((prev) => {
          if (!prev || prev.id !== targetId) return prev;
          const sections = prev.sections.map((s) =>
            s.id === sectionId
              ? {
                  ...s,
                  tenantConfirmed: !dispute,
                  tenantFeedback: !dispute ? feedback : undefined,
                  tenantDispute: dispute,
                  confirmedAt: dispute ? undefined : new Date().toISOString(),
                }
              : s,
          );
          const confirmedCount = sections.filter(
            (s) => s.tenantConfirmed || s.tenantDispute,
          ).length;
          const hasDispute = sections.some((s) => s.tenantDispute);
          const next = {
            ...prev,
            sections,
            confirmedCount,
            status: hasDispute
              ? ('disputed' as const)
              : confirmedCount > 0
                ? ('partially_confirmed' as const)
                : prev.status,
          };
          patchTenantStore({ ingoingReport: next });
          return next;
        });
        return;
      }

      const updated = await submitTenantIngoingSectionFeedback(targetId, sectionId, {
        status: dispute ? 'disputed' : 'confirmed',
        comment: dispute || feedback || undefined,
      });
      const mapped = toIngoingReport(updated);
      setIngoing(mapped);
      setIngoingInspections((prev) => prev.map((r) => (r.id === mapped.id ? mapped : r)));
    },
    [apiConnected, ingoing?.id],
  );

  const approveIngoingReport = useCallback(
    async (inspectionId?: string) => {
      const targetId = inspectionId ?? ingoing?.id;
      if (!targetId) return;
      if (!apiConnected) {
        setIngoing((prev) => {
          if (!prev || prev.id !== targetId) return prev;
          const next: IngoingReport = {
            ...prev,
            status: 'confirmed',
            tenantApproved: true,
            tenantRejected: false,
          };
          patchTenantStore({ ingoingReport: next });
          return next;
        });
        return;
      }
      const approved = await approveTenantIngoingInspection(targetId);
      const mapped = toIngoingReport(approved);
      setIngoing(mapped);
      setIngoingInspections((prev) => prev.map((r) => (r.id === mapped.id ? mapped : r)));
    },
    [apiConnected, ingoing?.id],
  );

  const rejectIngoingReport = useCallback(
    async (reason: string, inspectionId?: string) => {
      const targetId = inspectionId ?? ingoing?.id;
      if (!targetId) return;
      if (!apiConnected) {
        setIngoing((prev) => {
          if (!prev || prev.id !== targetId) return prev;
          const next: IngoingReport = {
            ...prev,
            status: 'rejected',
            tenantRejected: true,
            rejectReason: reason,
          };
          patchTenantStore({ ingoingReport: next });
          return next;
        });
        return;
      }
      const rejected = await rejectTenantIngoingInspection(targetId, reason);
      const mapped = toIngoingReport(rejected);
      setIngoing(mapped);
      setIngoingInspections((prev) => prev.map((r) => (r.id === mapped.id ? mapped : r)));
    },
    [apiConnected, ingoing?.id],
  );

  const confirmOutgoingSection = useCallback(
    async (sectionId: string, dispute?: string) => {
      if (!outgoing) return;

      if (!apiConnected) {
        setOutgoing((prev) => {
          if (!prev) return prev;
          const sections = prev.sections.map((s) =>
            s.id === sectionId
              ? {
                  ...s,
                  tenantConfirmed: !dispute,
                  tenantDispute: dispute,
                  confirmedAt: dispute ? undefined : new Date().toISOString(),
                }
              : s,
          );
          const confirmedCount = sections.filter((s) => s.tenantConfirmed).length;
          const hasDispute = sections.some((s) => s.tenantDispute);
          let status = prev.status;
          if (hasDispute) status = 'disputed';
          else if (sections.every((s) => s.tenantConfirmed || s.tenantDispute)) {
            status = 'confirmed';
          }
          const next = { ...prev, sections, confirmedCount, status };
          patchTenantStore({ outgoingReport: next });
          return next;
        });
        return;
      }

      if (dispute) {
        const section = outgoing.sections.find((s) => s.id === sectionId);
        const updated = await disputeTenantOutgoingSection(outgoing.id, {
          area: section?.room ?? 'Area',
          description: dispute,
          sectionId,
        });
        const mapped = toOutgoingReport(updated);
        setOutgoing(mapped);
        setOutgoingInspections((prev) =>
          prev.map((r) => (r.id === mapped.id ? mapped : r)),
        );
        return;
      }

      const sections = outgoing.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              tenantConfirmed: true,
              tenantDispute: undefined,
              confirmedAt: new Date().toISOString(),
            }
          : s,
      );
      const confirmedCount = sections.filter((s) => s.tenantConfirmed).length;
      const allConfirmed = sections.every(
        (s) => s.tenantConfirmed || s.tenantDispute,
      );
      const hasDispute = sections.some((s) => s.tenantDispute);
      const interim: OutgoingReport = {
        ...outgoing,
        sections,
        confirmedCount,
        status: hasDispute ? 'disputed' : 'report_sent',
      };
      setOutgoing(interim);

      if (allConfirmed && !hasDispute) {
        const approved = await approveTenantOutgoingInspection(outgoing.id);
        const mapped = toOutgoingReport(approved);
        setOutgoing(mapped);
        setOutgoingInspections((prev) =>
          prev.map((r) => (r.id === mapped.id ? mapped : r)),
        );
      }
    },
    [apiConnected, outgoing],
  );

  const approveRepairCompletion = useCallback(
    async (id: string) => {
      if (!apiConnected) {
        throw new Error('Connect to the API to approve repair completion.');
      }
      const summary = await approveMaintenanceCompletion(id, { approved: true });
      const [mapped] = toTenantMaintenanceRequests([summary], propertyAddress);
      setMaintenance((prev) => {
        const next = prev.map((m) => (m.id === id ? { ...m, ...mapped } : m));
        persistMaintenance(next);
        return next;
      });
    },
    [apiConnected, persistMaintenance, propertyAddress],
  );

  const respondToMaintenanceScheduleHandler = useCallback(
    async (id: string, decision: 'approved' | 'declined', declineReason?: string) => {
      if (!apiConnected) {
        throw new Error('Connect to the API to respond to the proposed visit time.');
      }
      const summary = await respondToMaintenanceSchedule(id, {
        decision,
        ...(declineReason?.trim() ? { declineReason: declineReason.trim() } : {}),
      });
      const [mapped] = toTenantMaintenanceRequests([summary], propertyAddress);
      setMaintenance((prev) => {
        const next = prev.map((m) =>
          m.id === id
            ? {
                ...m,
                ...mapped,
                scheduleApprovalPending:
                  decision === 'approved' ? false : mapped.scheduleApprovalPending,
                scheduleProposedTimes:
                  decision === 'approved' ? null : mapped.scheduleProposedTimes,
              }
            : m,
        );
        persistMaintenance(next);
        return next;
      });
    },
    [apiConnected, persistMaintenance, propertyAddress],
  );

  const respondMaintenanceResponsibilityAckHandler = useCallback(
    async (id: string, agreed: boolean, reason?: string) => {
      if (!apiConnected) {
        throw new Error('Connect to the API to respond to maintenance responsibility.');
      }
      const summary = await respondMaintenanceResponsibilityAck(id, {
        agreed,
        ...(reason?.trim() ? { reason: reason.trim() } : {}),
      });
      const [mapped] = toTenantMaintenanceRequests([summary], propertyAddress);
      setMaintenance((prev) => {
        const next = prev.map((m) => (m.id === id ? { ...m, ...mapped } : m));
        persistMaintenance(next);
        return next;
      });
    },
    [apiConnected, persistMaintenance, propertyAddress],
  );

  const startVacating = useCallback(
    async (date: string, reason?: string) => {
      const applyLocalVacating = () => {
        const next: VacatingCase = {
          id: `vac-local-${Date.now()}`,
          propertyAddress,
          vacatingDate: date.slice(0, 10),
          status: 'open',
          currentStage: VACATING_STAGE.KEY_RETURN,
          keysReturned: false,
          tenantSettlementStatus: 'pending',
          outgoingStatus: 'report_sent',
          terminationReason: reason,
        };
        setVacatingState(next);
        setVacatingDisplay(next);
        patchTenantStore({ vacating: next });
      };

      if (status !== 'authed') {
        applyLocalVacating();
        return;
      }

      try {
        const created = await createTenantVacatingCase({
          expectedVacateDate: date,
          terminationReason: reason,
        });
        const mapped = toTenantVacatingCases([created])[0] ?? null;
        if (mapped) {
          setVacatingState(mapped);
          setVacatingDisplay(mapped);
          patchTenantStore({ vacating: mapped });
        } else {
          applyLocalVacating();
        }
      } catch {
        applyLocalVacating();
      }
    },
    [propertyAddress, status],
  );

  const recordVacatingDate = useCallback(
    (date: string) => {
      void startVacating(date);
    },
    [startVacating],
  );

  const cancelVacatingCase = useCallback(
    async (reason?: string) => {
      const id = vacatingDisplay?.id;
      if (!id || vacatingDisplay.status !== 'open') return;
      try {
        const updated = await cancelTenantVacatingCase(id, reason);
        const mapped = toTenantVacatingCases([updated])[0] ?? null;
        setVacatingState(null);
        setVacatingDisplay(mapped);
        patchTenantStore({ vacating: null });
      } catch {
        if (!vacatingDisplay) return;
        const local: VacatingCase = {
          ...vacatingDisplay,
          status: 'cancelled',
          cancellationReason: reason ?? 'Tenant no longer vacating',
        };
        setVacatingState(null);
        setVacatingDisplay(local);
        patchTenantStore({ vacating: null });
      }
    },
    [vacatingDisplay],
  );

  const updateVacateDate = useCallback(
    async (date: string) => {
      const id = vacatingDisplay?.id;
      if (!id) return;
      try {
        const updated = await updateTenantVacateDate(id, date);
        const mapped = toTenantVacatingCases([updated])[0] ?? null;
        setVacatingState(mapped);
        setVacatingDisplay(mapped);
        patchTenantStore({ vacating: mapped });
      } catch {
        if (!vacatingDisplay) return;
        const local: VacatingCase = {
          ...vacatingDisplay,
          vacatingDate: date,
          vacateDateChanged:
            !!vacatingDisplay.initialVacatingDate &&
            vacatingDisplay.initialVacatingDate.slice(0, 10) !== date.slice(0, 10),
          initialVacatingDate:
            vacatingDisplay.initialVacatingDate ?? vacatingDisplay.vacatingDate,
        };
        setVacatingState(local);
        setVacatingDisplay(local);
        patchTenantStore({ vacating: local });
      }
    },
    [vacatingDisplay],
  );

  const applyVacatingCaseUpdate = useCallback((updated: VacatingCase | null) => {
    setVacatingState(updated?.status === 'open' ? updated : null);
    setVacatingDisplay(updated);
    patchTenantStore({ vacating: updated?.status === 'open' ? updated : null });
  }, []);

  const acceptVacatingSettlement = useCallback(
    async (caseId: string) => {
      if (status !== 'authed') return;
      try {
        const updated = await acceptTenantVacatingSettlement(caseId);
        applyVacatingCaseUpdate(toTenantVacatingCases([updated])[0] ?? null);
      } catch {
        /* keep current state; a later refresh reconciles */
      }
    },
    [status, applyVacatingCaseUpdate],
  );

  const declineVacatingSettlement = useCallback(
    async (caseId: string, reason: string) => {
      if (status !== 'authed') return;
      try {
        const updated = await declineTenantVacatingSettlement(caseId, { reason });
        applyVacatingCaseUpdate(toTenantVacatingCases([updated])[0] ?? null);
      } catch {
        /* keep current state; a later refresh reconciles */
      }
    },
    [status, applyVacatingCaseUpdate],
  );

  const respondRentReview = useCallback(
    async (
      id: string,
      action: 'accept' | 'reject' | 'counter',
      payload?: { amount?: number; moveOutDate?: string; reason?: string },
    ) => {
      const applyLocal = () => {
        setRentReviews((prev) => {
          const current = prev.find((r) => r.id === id);
          if (action === 'counter' && current?.rentNegotiable !== true) {
            return prev;
          }
          const next = prev.map((r) => {
            if (r.id !== id) return r;
            if (action === 'accept') return { ...r, status: 'accepted' as const };
            if (action === 'reject') {
              return {
                ...r,
                status: 'rejected' as const,
                moveOutDate: payload?.moveOutDate,
              };
            }
            return {
              ...r,
              status: 'countered' as const,
              counterHistory: [
                ...r.counterHistory,
                {
                  at: new Date().toISOString(),
                  amount: payload?.amount ?? r.currentRentWeekly,
                  by: 'tenant' as const,
                },
              ],
            };
          });
          patchTenantStore({ rentReviews: next });
          return next;
        });
      };

      if (status !== 'authed') {
        applyLocal();
        return;
      }

      const decision =
        action === 'accept' ? 'accept' : action === 'reject' ? 'reject' : 'counter';
      try {
        const updated = await submitTenantRentReviewResponse(id, {
          decision,
          moveOutDate: payload?.moveOutDate,
          counterWeekly: payload?.amount,
        });
        setRentReviews((prev) => {
          const mapped = toTenantRentReviews([updated])[0];
          if (!mapped) return prev;
          const next = prev.map((r) => (r.id === id ? mapped : r));
          patchTenantStore({ rentReviews: next });
          return next;
        });
        if (decision === 'accept') {
          try {
            const tenancies = await fetchTenancies();
            setLease(toLeaseSummary(tenancies));
          } catch {
            /* best-effort — property page also reads nextRentReviewOpensOn from the review */
          }
        }
      } catch {
        applyLocal();
      }
    },
    [status, startVacating],
  );

  const signLeaseAgreement = useCallback(
    async (reviewId: string) => {
      if (status !== 'authed') {
        setRentReviews((prev) => {
          const next = prev.map((r) =>
            r.id === reviewId && r.noticeTerms
              ? {
                  ...r,
                  noticeTerms: {
                    ...r.noticeTerms,
                    leaseAgreementSigned: true,
                    requiresLeaseAgreementSign: false,
                  },
                }
              : r,
          );
          patchTenantStore({ rentReviews: next });
          return next;
        });
        return;
      }

      const updated = await signTenantRentReviewLeaseAgreement(reviewId);
      setRentReviews((prev) => {
        const mapped = toTenantRentReviews([updated])[0];
        if (!mapped) return prev;
        const next = prev.map((r) => (r.id === reviewId ? mapped : r));
        patchTenantStore({ rentReviews: next });
        return next;
      });
    },
    [status],
  );

  const phase: TenantLifecyclePhase = lease ? 'active' : 'searching';

  const storedDocuments = useMemo(() => {
    if (apiDocuments !== null) return apiDocuments;

    const docs: TenantDocumentView[] = [];
    if (lease) {
      docs.push(
        ...lease.documents.map((d) => ({
          ...d,
          category: 'Lease',
        })),
      );
    }
    docs.push(
      ...rentReceipts
        .filter((r) => r.pdfAvailable)
        .map((r) => ({
          id: r.id,
          name: `Rent receipt — ${r.periodStart.slice(0, 7)}.pdf`,
          category: 'Rent receipt',
          uploadedAt: r.issuedAt,
        })),
    );
    docs.push(
      ...paymentProofs
        .filter((p) => p.fileName)
        .map((p) => ({
          id: p.id,
          name: p.fileName!,
          category: p.type === 'deposit' ? 'Deposit proof' : 'Bond proof',
          uploadedAt: p.uploadedAt ?? '—',
        })),
    );
    return docs;
  }, [apiDocuments, lease, rentReceipts, paymentProofs]);

  const activeVacating = useMemo(
    () => (vacatingDisplay?.status === 'open' ? vacatingDisplay : null),
    [vacatingDisplay],
  );

  const vacatingCase = useMemo(() => vacatingDisplay, [vacatingDisplay]);

  const displayedInspections = useMemo(() => {
    const routineCards = toRoutineInspectionSummaries(routineInspections);
    const nonRoutine = inspections.filter((i) => i.type !== 'routine');
    return [...routineCards, ...nonRoutine];
  }, [inspections, routineInspections]);

  const propertyContacts = useMemo(
    () =>
      resolveTenantPropertyContacts({
        property: leasedPropertyContacts,
        maintenance,
      }),
    [leasedPropertyContacts, maintenance],
  );

  const value = useMemo<TenantDataContextValue>(
    () => ({
      loading,
      apiConnected,
      profileUnlinked,
      phase,
      refresh,
      pendingActions,
      notifications,
      listings,
      listingsLoading,
      listingsError,
      applications,
      newLeasingCases,
      ingoingInspections,
      outgoingInspections,
      routineInspections,
      onboardingSteps,
      leasingOnboarding,
      refreshLeasingOnboarding,
      lease,
      ingoingReport: ingoing,
      outgoingReport: outgoing,
      maintenance,
      messages,
      propertyContacts,
      rentReceipts,
      rentReviews,
      renewal,
      vacating: activeVacating,
      vacatingCase,
      inspections: displayedInspections,
      terminationNotice,
      addRepair,
      addApplication,
      addMessageThread,
      getThreadMessages,
      sendThreadMessage,
      markThreadRead,
      recordRentPayment,
      approveRepairCompletion,
      respondToMaintenanceSchedule: respondToMaintenanceScheduleHandler,
      respondMaintenanceResponsibilityAck: respondMaintenanceResponsibilityAckHandler,
      recordVacatingDate,
      startVacating,
      cancelVacatingCase,
      updateVacateDate,
      acceptVacatingSettlement,
      declineVacatingSettlement,
      finalStatement,
      arrears,
      paymentProofs,
      outstandingBalance,
      storedDocuments,
      markNotificationRead,
      confirmIngoingSection,
      approveIngoingReport,
      rejectIngoingReport,
      confirmOutgoingSection,
      respondRentReview,
      signLeaseAgreement,
    }),
    [
      loading,
      apiConnected,
      profileUnlinked,
      phase,
      refresh,
      pendingActions,
      notifications,
      listings,
      listingsLoading,
      listingsError,
      applications,
      newLeasingCases,
      ingoingInspections,
      outgoingInspections,
      routineInspections,
      onboardingSteps,
      leasingOnboarding,
      refreshLeasingOnboarding,
      lease,
      ingoing,
      outgoing,
      maintenance,
      messages,
      propertyContacts,
      rentReceipts,
      rentReviews,
      renewal,
      activeVacating,
      vacatingCase,
      displayedInspections,
      terminationNotice,
      addRepair,
      addApplication,
      addMessageThread,
      getThreadMessages,
      sendThreadMessage,
      markThreadRead,
      recordRentPayment,
      approveRepairCompletion,
      respondToMaintenanceScheduleHandler,
      respondMaintenanceResponsibilityAckHandler,
      recordVacatingDate,
      startVacating,
      cancelVacatingCase,
      updateVacateDate,
      acceptVacatingSettlement,
      declineVacatingSettlement,
      finalStatement,
      arrears,
      paymentProofs,
      outstandingBalance,
      storedDocuments,
      markNotificationRead,
      confirmIngoingSection,
      approveIngoingReport,
      rejectIngoingReport,
      confirmOutgoingSection,
      respondRentReview,
      signLeaseAgreement,
    ],
  );

  return (
    <TenantDataContext.Provider value={value}>{children}</TenantDataContext.Provider>
  );
}

export function useTenantData(): TenantDataContextValue {
  const ctx = useContext(TenantDataContext);
  if (!ctx) {
    throw new Error('useTenantData must be used within TenantDataProvider');
  }
  return ctx;
}
