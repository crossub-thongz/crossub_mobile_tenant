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
import { fetchMaintenanceState } from '@/lib/crossub-api/maintenance-client';
import {
  APPLICATIONS,
  ARREARS,
  DEMO_FINAL_STATEMENT,
  DEMO_VACATING,
  FINAL_STATEMENT,
  INGOING_REPORT,
  LEASE,
  LISTING_PROPERTIES,
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
  TENANT_PHASE,
  VACATING,
} from '@/lib/mock-data';
import type {
  ArrearsNotice,
  FinalStatement,
  IngoingReport,
  LeaseSummary,
  ListingProperty,
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
  TenantLifecyclePhase,
  TenantNotification,
  VacatingCase,
} from '@/lib/types';
import { useDemoData } from '@/lib/utils';

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
  storedDocuments: { id: string; name: string; category: string; uploadedAt: string }[];
  markNotificationRead: (id: string) => void;
  confirmIngoingSection: (sectionId: string, dispute?: string) => void;
  confirmOutgoingSection: (sectionId: string, dispute?: string) => void;
  respondRentReview: (
    id: string,
    action: 'accept' | 'reject' | 'counter',
    payload?: { amount?: number; moveOutDate?: string; reason?: string },
  ) => void;
}

const TenantDataContext = createContext<TenantDataContextValue | null>(null);

export function TenantDataProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const demo = useDemoData();
  const [loading, setLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);
  const [maintenance, setMaintenance] = useState(DEMO_MAINTENANCE);
  const [ingoing, setIngoing] = useState(INGOING_REPORT);
  const [rentReviews, setRentReviews] = useState(RENT_REVIEWS);
  const [outgoing, setOutgoing] = useState(OUTGOING_REPORT);

  const refresh = useCallback(async () => {
    setLoading(true);
    if (demo || status !== 'authed') {
      setApiConnected(false);
      setMaintenance(DEMO_MAINTENANCE);
      setLoading(false);
      return;
    }
    try {
      const state = await fetchMaintenanceState();
      setApiConnected(true);
      if (state.requests?.length) {
        setMaintenance(
          state.requests.map((r) => ({
            id: r.id,
            trackingNumber: r.trackingNumber ?? r.id,
            propertyAddress: r.propertyAddress ?? LEASE.propertyAddress,
            category: 'General',
            description: r.description ?? r.title ?? '',
            area: '—',
            urgency: 'normal' as const,
            status: 'submitted' as const,
            statusLabel: r.status ?? 'Submitted',
            createdAt: r.createdAt ?? new Date().toISOString(),
            timeline: [],
          })),
        );
      }
    } catch {
      setApiConnected(false);
      setMaintenance(DEMO_MAINTENANCE);
    } finally {
      setLoading(false);
    }
  }, [demo, status]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const confirmIngoingSection = useCallback((sectionId: string, dispute?: string) => {
    setIngoing((prev) => {
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
      return { ...prev, sections, confirmedCount, status: reportStatus };
    });
  }, []);

  const confirmOutgoingSection = useCallback((sectionId: string, dispute?: string) => {
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
      return { ...prev, sections, confirmedCount, status };
    });
  }, []);

  const respondRentReview = useCallback(
    (
      id: string,
      action: 'accept' | 'reject' | 'counter',
      payload?: { amount?: number; moveOutDate?: string; reason?: string },
    ) => {
      setRentReviews((prev) =>
        prev.map((r) => {
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
        }),
      );
    },
    [],
  );

  const value = useMemo<TenantDataContextValue>(
    () => ({
      loading,
      apiConnected,
      phase: TENANT_PHASE,
      refresh,
      pendingActions: PENDING_ACTIONS,
      notifications,
      listings: LISTING_PROPERTIES,
      applications: APPLICATIONS,
      onboardingSteps: ONBOARDING_STEPS,
      lease: LEASE,
      ingoingReport: ingoing,
      maintenance,
      messages: MESSAGE_THREADS,
      rentReceipts: RENT_RECEIPTS,
      rentReviews,
      renewal: RENEWAL,
      vacating: SHOW_PHASE3_DEMO ? DEMO_VACATING : VACATING,
      finalStatement: SHOW_PHASE3_DEMO ? DEMO_FINAL_STATEMENT : FINAL_STATEMENT,
      arrears: ARREARS,
      paymentProofs: PAYMENT_PROOFS,
      outstandingBalance: OUTSTANDING_BALANCE,
      outgoingReport: outgoing,
      showPhase3Demo: SHOW_PHASE3_DEMO,
      storedDocuments: [
        ...LEASE.documents.map((d) => ({
          ...d,
          category: 'Lease',
        })),
        ...PAYMENT_PROOFS.filter((p) => p.fileName).map((p) => ({
          id: p.id,
          name: p.fileName!,
          category: p.type === 'deposit' ? 'Deposit proof' : 'Bond proof',
          uploadedAt: p.uploadedAt ?? '—',
        })),
      ],
      markNotificationRead,
      confirmIngoingSection,
      confirmOutgoingSection,
      respondRentReview,
    }),
    [
      loading,
      apiConnected,
      refresh,
      notifications,
      maintenance,
      ingoing,
      outgoing,
      rentReviews,
      markNotificationRead,
      confirmIngoingSection,
      confirmOutgoingSection,
      respondRentReview,
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
