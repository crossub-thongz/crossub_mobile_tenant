import {
  DEMO_PREVIEW_EMAIL,
  DEMO_PREVIEW_PASSWORD,
  isDemoPreviewAccount,
} from '@/lib/demo-account';
import {
  loginLocalAccount,
  registerLocalAccount,
  type RegisterInput,
} from '@/lib/local-auth';

/** Ensures the shared production demo account exists in this browser. */
export function ensureDemoPreviewAccount(): void {
  if (loginLocalAccount(DEMO_PREVIEW_EMAIL, DEMO_PREVIEW_PASSWORD)) return;

  const input: RegisterInput = {
    email: DEMO_PREVIEW_EMAIL,
    password: DEMO_PREVIEW_PASSWORD,
    firstName: 'Demo',
    lastName: 'Tenant',
    phone: '',
  };
  registerLocalAccount(input);
}

/** Sign in as the production demo tenant (full mock tenancy). */
export function loginAsDemoPreviewAccount(): boolean {
  ensureDemoPreviewAccount();
  return Boolean(loginLocalAccount(DEMO_PREVIEW_EMAIL, DEMO_PREVIEW_PASSWORD));
}

export function getDemoPreviewEmail(): string {
  return DEMO_PREVIEW_EMAIL;
}

export function getDemoPreviewPassword(): string {
  return DEMO_PREVIEW_PASSWORD;
}

export { isDemoPreviewAccount };
