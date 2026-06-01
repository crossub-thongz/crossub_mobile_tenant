import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import { AuthProvider } from '@/components/providers/auth-provider';
import { TenantDataProvider } from '@/components/providers/tenant-data-provider';
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
  themeColor: '#0b0f10',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-background">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <TenantDataProvider>
            {children}
          </TenantDataProvider>
        </AuthProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
