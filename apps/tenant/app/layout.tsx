import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Inter } from 'next/font/google';

import { AuthProvider } from '@/components/providers/auth-provider';
import { TenantDataProvider } from '@/components/providers/tenant-data-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { StripEmojisGuard } from '@/components/providers/strip-emojis-guard';
import { SystemAccessAgreementGate } from '@/components/auth/system-access-agreement-gate';
import { OnboardingGuideGate } from '@/components/tenant/onboarding-guide-gate';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'CROSSUB | Tenant App',
  description:
    'Workflow-driven tenant portal — applications, onboarding, lease, maintenance, rent review, and vacating.',
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background`}>
        <Script id="crossub-theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('theme');var d=document.documentElement;if(t==='dark')d.classList.add('dark');else d.classList.remove('dark')}catch(e){}})();`}
        </Script>
        <ThemeProvider>
          <StripEmojisGuard />
          <AuthProvider>
            <TenantDataProvider>
              <SystemAccessAgreementGate />
              <OnboardingGuideGate />
              {children}
            </TenantDataProvider>
          </AuthProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              classNames: {
                toast: 'bg-card border-border text-foreground',
                title: 'text-foreground',
                description: 'text-muted-foreground',
                success: 'border-primary/20 bg-primary/5',
                error: 'border-destructive/20 bg-destructive/5',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
