import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

export interface ProvisionedTenantAccount {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: string;
  provisionedVia: 'agent_portal';
}

export interface TenantProvisionInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

const dataDir = path.join(process.cwd(), '.data');
const accountsFile = path.join(dataDir, 'tenant-accounts.json');

async function readAccounts(): Promise<ProvisionedTenantAccount[]> {
  try {
    const raw = await readFile(accountsFile, 'utf8');
    return JSON.parse(raw) as ProvisionedTenantAccount[];
  } catch {
    return [];
  }
}

async function writeAccounts(accounts: ProvisionedTenantAccount[]): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  await writeFile(accountsFile, JSON.stringify(accounts, null, 2), 'utf8');
}

export async function provisionTenantAccount(
  input: TenantProvisionInput,
): Promise<Omit<ProvisionedTenantAccount, 'password'>> {
  const email = input.email.trim().toLowerCase();
  const accounts = await readAccounts();
  if (accounts.some((a) => a.email === email)) {
    throw new Error('An account with this email already exists.');
  }

  const account: ProvisionedTenantAccount = {
    id: `tenant-${Date.now()}`,
    email,
    password: input.password,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    phone: input.phone?.trim(),
    createdAt: new Date().toISOString(),
    provisionedVia: 'agent_portal',
  };

  await writeAccounts([...accounts, account]);

  const { password: _password, ...safe } = account;
  return safe;
}

export async function verifyProvisionedAccount(
  email: string,
  password: string,
): Promise<Omit<ProvisionedTenantAccount, 'password'> | null> {
  const normalized = email.trim().toLowerCase();
  const accounts = await readAccounts();
  const account = accounts.find(
    (a) => a.email === normalized && a.password === password,
  );
  if (!account) return null;
  const { password: _password, ...safe } = account;
  return safe;
}
