export interface TenantRuntimeConfig {
  useDemoData: boolean;
}

declare global {
  interface Window {
    __TENANT_RUNTIME__?: TenantRuntimeConfig;
  }
}

export function getClientRuntimeConfig(): TenantRuntimeConfig | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.__TENANT_RUNTIME__;
}
