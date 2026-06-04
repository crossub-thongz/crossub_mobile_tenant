import { COOKIE_ACCESS, COOKIE_REFRESH } from '@/constants/auth';
import { Role, UserStatus } from '@/constants/roles';
import type { AuthUser } from '@/lib/auth-types';
import { initEmptyTenantStore } from '@/lib/tenant-store';

const ACCOUNTS_KEY = 'crossub_tenant_accounts';
const SESSION_KEY = 'crossub_tenant_session';
const LOCAL_ACCESS_VALUE = 'local';

export interface LocalAccount {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

function readAccounts(): LocalAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as LocalAccount[]) : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: LocalAccount[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function accountToUser(account: LocalAccount): AuthUser {
  return {
    id: account.id,
    email: account.email,
    role: Role.STAFF,
    status: UserStatus.ACTIVE,
    profileCompleted: true,
    firstName: account.firstName,
    lastName: account.lastName,
    phone: account.phone ?? null,
  };
}

function setAccessCookie(): void {
  if (typeof window === 'undefined') return;
  const maxAge = 60 * 60 * 24 * 30;
  document.cookie = `${COOKIE_ACCESS}=${LOCAL_ACCESS_VALUE}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function getLocalSessionUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { userId } = JSON.parse(raw) as { userId: string };
    const account = readAccounts().find((a) => a.id === userId);
    return account ? accountToUser(account) : null;
  } catch {
    return null;
  }
}

export function getAccessCookieValue(): string | null {
  if (typeof window === 'undefined') return null;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(`${COOKIE_ACCESS}=`)) {
      return trimmed.slice(COOKIE_ACCESS.length + 1) || null;
    }
  }
  return null;
}

export function isLocalAccessCookie(): boolean {
  return getAccessCookieValue() === LOCAL_ACCESS_VALUE;
}

/** @deprecated use isLocalAccessCookie */
export function hasLocalAccessCookie(): boolean {
  return isLocalAccessCookie();
}

/** Device signup cookie without sessionStorage — middleware still allows access. */
export function hasStaleLocalCookie(): boolean {
  return isLocalAccessCookie() && !getLocalSessionUser();
}

export function registerLocalAccount(input: RegisterInput): AuthUser {
  const email = input.email.trim().toLowerCase();
  const accounts = readAccounts();
  if (accounts.some((a) => a.email === email)) {
    throw new Error('An account with this email already exists.');
  }
  clearLocalSession();
  const account: LocalAccount = {
    id: `tenant-${Date.now()}`,
    email,
    password: input.password,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    phone: input.phone?.trim(),
    createdAt: new Date().toISOString(),
  };
  writeAccounts([...accounts, account]);
  initEmptyTenantStore(account.id);
  startLocalSession(account);
  return accountToUser(account);
}

export function loginLocalAccount(email: string, password: string): AuthUser | null {
  const normalized = email.trim().toLowerCase();
  const account = readAccounts().find(
    (a) => a.email === normalized && a.password === password,
  );
  if (!account) return null;
  startLocalSession(account);
  return accountToUser(account);
}

function startLocalSession(account: LocalAccount): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ userId: account.id }));
  setAccessCookie();
}

export function clearLocalSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
  document.cookie = `${COOKIE_ACCESS}=; path=/; max-age=0`;
  document.cookie = `${COOKIE_REFRESH}=; path=/; max-age=0`;
}
