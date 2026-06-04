import { categoryFromMessageType } from '@/lib/message-categories';
import { isLocalRegisteredUser } from '@/lib/tenant-user';
import type {
  ArrearsNotice,
  IngoingReport,
  MaintenanceRequest,
  MessageThread,
  OutgoingReport,
  OutstandingBalance,
  RentalApplication,
  RentReceipt,
  RentReviewCase,
  TenantNotification,
  ThreadMessage,
  VacatingCase,
} from '@/lib/types';

const STORAGE_KEY_PREFIX = 'crossub_tenant_data_v1';
const LEGACY_STORAGE_KEY = 'crossub_tenant_data_v1';
const LEGACY_MIGRATED_KEY = 'crossub_tenant_legacy_migrated_v1';

export function tenantStorageKey(userId: string | null): string {
  return userId ? `${STORAGE_KEY_PREFIX}_${userId}` : `${STORAGE_KEY_PREFIX}_guest`;
}

export interface TenantPersistedData {
  maintenance: MaintenanceRequest[];
  applications: RentalApplication[];
  messages: MessageThread[];
  notifications: TenantNotification[];
  ingoingReport: IngoingReport | null;
  outgoingReport: OutgoingReport | null;
  rentReviews: RentReviewCase[];
  vacating: VacatingCase | null;
  rentReceipts?: RentReceipt[];
  arrears?: ArrearsNotice | null;
  outstandingBalance?: OutstandingBalance | null;
  threadMessages?: Record<string, ThreadMessage[]>;
}

function emptyPersisted(): TenantPersistedData {
  return {
    maintenance: [],
    applications: [],
    messages: [],
    notifications: [],
    ingoingReport: null,
    outgoingReport: null,
    rentReviews: [],
    vacating: null,
  };
}

export function readTenantStore(userId: string | null = null): TenantPersistedData {
  if (typeof window === 'undefined') return emptyPersisted();
  try {
    const key = tenantStorageKey(userId);
    let raw = localStorage.getItem(key);
    if (
      !raw &&
      userId &&
      !isLocalRegisteredUser(userId) &&
      !localStorage.getItem(LEGACY_MIGRATED_KEY) &&
      localStorage.getItem(LEGACY_STORAGE_KEY)
    ) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        localStorage.setItem(key, raw);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        localStorage.setItem(LEGACY_MIGRATED_KEY, userId);
      }
    }
    if (!raw) return emptyPersisted();
    const parsed = JSON.parse(raw) as Partial<TenantPersistedData>;
    return { ...emptyPersisted(), ...parsed };
  } catch {
    return emptyPersisted();
  }
}

export function writeTenantStore(
  userId: string | null,
  data: TenantPersistedData,
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(tenantStorageKey(userId), JSON.stringify(data));
  } catch {
    /* quota or private mode */
  }
}

export function patchTenantStore(
  userId: string | null,
  patch: Partial<TenantPersistedData>,
): TenantPersistedData {
  const next = { ...readTenantStore(userId), ...patch };
  writeTenantStore(userId, next);
  return next;
}

export function initEmptyTenantStore(userId: string): void {
  writeTenantStore(userId, emptyPersisted());
}

/** User-created repairs (prefixed) merged ahead of demo seed. */
export function mergeMaintenance(
  seed: MaintenanceRequest[],
  persisted: MaintenanceRequest[],
): MaintenanceRequest[] {
  const seedIds = new Set(seed.map((m) => m.id));
  const userAdded = persisted.filter((m) => !seedIds.has(m.id));
  const updatedSeed = seed.map((m) => persisted.find((p) => p.id === m.id) ?? m);
  return [...userAdded, ...updatedSeed];
}

export function mergeApplications(
  seed: RentalApplication[],
  persisted: RentalApplication[],
): RentalApplication[] {
  const seedIds = new Set(seed.map((a) => a.id));
  const userAdded = persisted.filter((a) => !seedIds.has(a.id));
  return [...userAdded, ...seed];
}

export function mergeMessages(
  seed: MessageThread[],
  persisted: MessageThread[],
): MessageThread[] {
  const seedIds = new Set(seed.map((m) => m.id));
  const withDefaults = (m: MessageThread): MessageThread => ({
    ...m,
    recipient: m.recipient ?? 'agent',
    category: m.category ?? categoryFromMessageType(m.type),
  });
  const userAdded = persisted.filter((m) => !seedIds.has(m.id)).map(withDefaults);
  const mergedSeed = seed.map((m) => {
    const p = persisted.find((x) => x.id === m.id);
    return withDefaults(p ? { ...m, ...p } : m);
  });
  return [...userAdded, ...mergedSeed];
}

export function mergeNotifications(
  seed: TenantNotification[],
  persisted: TenantNotification[],
): TenantNotification[] {
  const seedIds = new Set(seed.map((n) => n.id));
  const userAdded = persisted.filter((n) => !seedIds.has(n.id));
  const updatedSeed = seed.map((n) => persisted.find((p) => p.id === n.id) ?? n);
  return [...userAdded, ...updatedSeed];
}

export function nextTrackingNumber(): string {
  const year = new Date().getFullYear();
  const suffix = String(Date.now()).slice(-5);
  return `MR-${year}-${suffix}`;
}

export function nextApplicationRef(): string {
  const year = new Date().getFullYear();
  const suffix = String(Date.now()).slice(-4);
  return `APP-${year}-${suffix}`;
}
