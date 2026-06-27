'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '@/components/providers/auth-provider';
import {
  fetchLedger,
  fetchMaintenanceRequests,
  fetchTenancies,
} from '@/lib/crossub-api/tenant-account-client';
import {
  toLeaseSummary,
  toRentPaymentReceipts,
  toTenantMaintenanceRequests,
} from '@/lib/crossub-api/tenant-mappers';
import { LISTING_PROPERTIES, TENANT_PHASE } from '@/lib/mock-data';
import { categoryToMessageType } from '@/lib/message-categories';
import { SEED_THREAD_MESSAGES, mergeThreadMessages } from '@/lib/message-threads';
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
  MessageCategory,
  MessageParty,
  MessageThread,
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
import { useDemoData } from '@/lib/utils';

export interface NewRepairInput {
  category: string;
  description: string;
  area: string;
  urgency: Priority;
  propertyAddress?: string;
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
  phase: TenantLifecyclePhase;
  refresh: () => Promise<void>;
  pendingActions: PendingAction[];
  notifications: TenantNotification[];
  listings: ListingProperty[];
  applications: RentalApplication[];
  onboardingSteps: OnboardingStep[];
  lease: LeaseSummary | null;
  ingoingReport: IngoingReport | null;
  maintenance: MaintenanceRequest[];
  messages: MessageThread[];
  rentReceipts: RentReceipt[];
  rentReviews: RentReviewCase[];
  renewal: RenewalDecision | null;
  vacating: VacatingCase | null;
  finalStatement: FinalStatement | null;
  arrears: ArrearsNotice | null;
  paymentProofs: PaymentProofRecord[];
  outstandingBalance: OutstandingBalance | null;
  outgoingReport: OutgoingReport;
  showPhase3Demo: boolean;
  inspections: InspectionSummary[];
  terminationNotice: TerminationNotice | null;
  storedDocuments: { id: string; name: string; category: string; uploadedAt: string }[];
  addRepair: (input: NewRepairInput) => MaintenanceRequest;
  addApplication: (input: NewApplicationInput) => RentalApplication;
  addMessageThread: (input: NewMessageInput) => MessageThread;
  getThreadMessages: (threadId: string) => ThreadMessage[];
  sendThreadMessage: (threadId: string, body: string, to: MessageParty) => void;
  recordRentPayment: (input: RecordRentPaymentInput) => RentReceipt;
  approveRepairCompletion: (id: string) => void;
  recordVacatingDate: (date: string) => void;
  markNotificationRead: (id: string) => void;
  confirmIngoingSection: (sectionId: string, dispute?: string) => void;
  confirmOutgoingSection: (sectionId: string, dispute?: string) => void;
  respondRentReview: (
    id: string,
    action: 'accept' | 'reject' | 'counter',
    payload?: { amount?: number; moveOutDate?: string; reason?: string },
  ) => void;
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
    setOutgoing: (v: OutgoingReport) => void;
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
    setShowPhase3Demo: (v: boolean) => void;
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
  setters.setShowPhase3Demo(loaded.showPhase3Demo);
  setters.setVacatingDisplay(loaded.vacating);
}

export function TenantDataProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const demo = useDemoData();

  const [loading, setLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);
  const [notifications, setNotifications] = useState<TenantNotification[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [applications, setApplications] = useState<RentalApplication[]>([]);
  const [messages, setMessages] = useState<MessageThread[]>([]);
  const [ingoing, setIngoing] = useState<IngoingReport | null>(null);
  const [rentReviews, setRentReviews] = useState<RentReviewCase[]>([]);
  const [outgoing, setOutgoing] = useState<OutgoingReport>({
    id: 'out-empty',
    propertyAddress: '—',
    status: 'report_sent',
    sections: [],
    confirmedCount: 0,
  });
  const [vacatingState, setVacatingState] = useState<VacatingCase | null>(null);
  const [vacatingDisplay, setVacatingDisplay] = useState<VacatingCase | null>(null);
  const [lease, setLease] = useState<LeaseSummary | null>(null);
  const [rentReceipts, setRentReceipts] = useState<RentReceipt[]>([]);
  const [arrears, setArrears] = useState<ArrearsNotice | null>(null);
  const [outstandingBalance, setOutstandingBalance] =
    useState<OutstandingBalance | null>(null);
  const [paymentProofs, setPaymentProofs] = useState<PaymentProofRecord[]>([]);
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [renewal, setRenewal] = useState<RenewalDecision | null>(null);
  const [terminationNotice, setTerminationNotice] = useState<TerminationNotice | null>(null);
  const [finalStatement, setFinalStatement] = useState<FinalStatement | null>(null);
  const [showPhase3Demo, setShowPhase3Demo] = useState(false);

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
      setShowPhase3Demo,
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

  const persistMaintenance = useCallback((next: MaintenanceRequest[]) => {
    patchTenantStore({ maintenance: next });
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const loaded = loadInitialState();
    applyLoadedState(loaded, setters);

    if (demo || status !== 'authed') {
      setApiConnected(false);
      setLoading(false);
      return;
    }

    // Pull every facade-backed screen (lease, ledger, repairs) in parallel. A 403
    // (tenant not yet linked to a Person/tenancy) or a network error on any one leaves
    // that screen on its seed data — the app stays usable rather than going blank.
    const [tenancies, ledger, requests] = await Promise.allSettled([
      fetchTenancies(),
      fetchLedger(),
      fetchMaintenanceRequests(),
    ]);

    let connected = false;

    if (tenancies.status === 'fulfilled') {
      connected = true;
      // Powers both the Lease and Property screens (both read `lease`).
      setLease(toLeaseSummary(tenancies.value));
    }

    if (ledger.status === 'fulfilled') {
      connected = true;
      setRentReceipts(toRentPaymentReceipts(ledger.value));
      // The thin ledger carries no reliable arrears signal, so clear the seed banners
      // rather than show demo arrears alongside real payments.
      setArrears(null);
      setOutstandingBalance(null);
    }

    if (requests.status === 'fulfilled') {
      connected = true;
      const fromApi = toTenantMaintenanceRequests(
        requests.value,
        loaded.lease?.propertyAddress,
      );
      // Keep the tenant's own locally-created (optimistic) repairs, drop demo seeds.
      const apiIds = new Set(fromApi.map((r) => r.id));
      const localOnly = readTenantStore().maintenance.filter(
        (m) => !apiIds.has(m.id),
      );
      setMaintenance([...localOnly, ...fromApi]);
    }

    setApiConnected(connected);
    setLoading(false);
  }, [demo, status, setters]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const propertyAddress = lease?.propertyAddress ?? 'Your property';
  const leaseId = lease?.id;

  const addRepair = useCallback(
    (input: NewRepairInput): MaintenanceRequest => {
      const createdAt = new Date().toISOString();
      const item: MaintenanceRequest = {
        id: `repair-${Date.now()}`,
        trackingNumber: nextTrackingNumber(),
        propertyAddress: input.propertyAddress ?? propertyAddress,
        category: input.category,
        description: input.description,
        area: input.area,
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
    (threadId: string): ThreadMessage[] => {
      const stored = readTenantStore();
      return mergeThreadMessages(threadId, SEED_THREAD_MESSAGES, stored.threadMessages);
    },
    [],
  );

  const sendThreadMessage = useCallback(
    (threadId: string, body: string, to: MessageParty) => {
      const trimmed = body.trim();
      if (!trimmed) return;
      const now = new Date().toISOString();
      const thread = messages.find((m) => m.id === threadId);
      const outbound: ThreadMessage = {
        id: `tm-${Date.now()}`,
        at: now,
        direction: 'outbound',
        party: to,
        fromName: 'You',
        body: trimmed,
        channel: 'app',
      };
      const stored = readTenantStore();
      const threadMessages = {
        ...(stored.threadMessages ?? {}),
        [threadId]: [...(stored.threadMessages?.[threadId] ?? []), outbound],
      };
      setMessages((prev) => {
        const next = prev.map((t) => {
          if (t.id !== threadId) return t;
          const updated = {
            ...t,
            lastMessage: trimmed,
            lastAt: now,
            unread: 0,
          };
          if (to === 'contractor' && !t.contractorEnabled) {
            return {
              ...updated,
              contractorEnabled: true,
              contractorName: t.contractorName ?? 'Contractor',
            };
          }
          return updated;
        });
        patchTenantStore( { messages: next, threadMessages });
        return next;
      });
    },
    [messages],
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
      const stored = readTenantStore();
      const threadMessages = {
        ...(stored.threadMessages ?? {}),
        [id]: [outbound],
      };
      setMessages((prev) => {
        const next = [item, ...prev];
        patchTenantStore( { messages: next, threadMessages });
        return next;
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
      setNotifications((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
        patchTenantStore( { notifications: next });
        return next;
      });
    },
    [],
  );

  const confirmIngoingSection = useCallback(
    (sectionId: string, dispute?: string) => {
      setIngoing((prev) => {
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
        const allConfirmed = sections.every((s) => s.tenantConfirmed || s.tenantDispute);
        let reportStatus = prev.status;
        if (hasDispute) reportStatus = 'disputed';
        else if (allConfirmed) reportStatus = 'confirmed';
        else if (confirmedCount > 0) reportStatus = 'partially_confirmed';
        const next = { ...prev, sections, confirmedCount, status: reportStatus };
        patchTenantStore( { ingoingReport: next });
        return next;
      });
    },
    [],
  );

  const confirmOutgoingSection = useCallback(
    (sectionId: string, dispute?: string) => {
      setOutgoing((prev) => {
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
        patchTenantStore( { outgoingReport: next });
        return next;
      });
    },
    [],
  );

  const approveRepairCompletion = useCallback(
    (id: string) => {
      setMaintenance((prev) => {
        const next = prev.map((m) =>
          m.id === id
            ? {
                ...m,
                tenantCompletionApproved: true,
                completionApprovalPending: false,
                status: 'closed' as const,
                statusLabel: 'Closed',
                progressPercent: 100,
              }
            : m,
        );
        persistMaintenance(next);
        return next;
      });
    },
    [persistMaintenance],
  );

  const recordVacatingDate = useCallback(
    (date: string) => {
      const next: VacatingCase = {
        id: 'vac-new',
        propertyAddress: propertyAddress,
        vacatingDate: date,
        outgoingStatus: 'report_sent',
        outgoingReportId: 'out-401',
      };
      setVacatingState(next);
      setVacatingDisplay(next);
      patchTenantStore( { vacating: next });
    },
    [propertyAddress],
  );

  const respondRentReview = useCallback(
    (
      id: string,
      action: 'accept' | 'reject' | 'counter',
      payload?: { amount?: number; moveOutDate?: string; reason?: string },
    ) => {
      setRentReviews((prev) => {
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
        patchTenantStore( { rentReviews: next });
        return next;
      });
    },
    [],
  );

  const phase: TenantLifecyclePhase = lease ? TENANT_PHASE : 'searching';

  const storedDocuments = useMemo(() => {
    const docs: { id: string; name: string; category: string; uploadedAt: string }[] = [];
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
  }, [lease, rentReceipts, paymentProofs]);

  const value = useMemo<TenantDataContextValue>(
    () => ({
      loading,
      apiConnected,
      phase,
      refresh,
      pendingActions,
      notifications,
      listings: LISTING_PROPERTIES,
      applications,
      onboardingSteps,
      lease,
      ingoingReport: ingoing,
      maintenance,
      messages,
      rentReceipts,
      rentReviews,
      renewal,
      vacating: vacatingDisplay,
      inspections,
      terminationNotice,
      addRepair,
      addApplication,
      addMessageThread,
      getThreadMessages,
      sendThreadMessage,
      recordRentPayment,
      approveRepairCompletion,
      recordVacatingDate,
      finalStatement,
      arrears,
      paymentProofs,
      outstandingBalance,
      outgoingReport: outgoing,
      showPhase3Demo,
      storedDocuments,
      markNotificationRead,
      confirmIngoingSection,
      confirmOutgoingSection,
      respondRentReview,
    }),
    [
      loading,
      apiConnected,
      phase,
      refresh,
      pendingActions,
      notifications,
      applications,
      onboardingSteps,
      lease,
      ingoing,
      maintenance,
      messages,
      rentReceipts,
      rentReviews,
      renewal,
      vacatingDisplay,
      inspections,
      terminationNotice,
      addRepair,
      addApplication,
      addMessageThread,
      getThreadMessages,
      sendThreadMessage,
      recordRentPayment,
      markNotificationRead,
      confirmIngoingSection,
      confirmOutgoingSection,
      approveRepairCompletion,
      recordVacatingDate,
      respondRentReview,
      finalStatement,
      arrears,
      paymentProofs,
      outstandingBalance,
      outgoing,
      showPhase3Demo,
      storedDocuments,
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
