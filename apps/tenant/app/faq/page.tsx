'use client';

import Link from 'next/link';
import { BookOpen, MessageSquare } from 'lucide-react';

import { TenantShell } from '@/components/layout/tenant-shell';
import { FaqSectionList } from '@/components/tenant/faq-section';
import { PageIntro } from '@/components/tenant/page-intro';
import { TENANT_FAQ_SECTIONS } from '@/constants/tenant-faq';
import { ROUTES } from '@/constants/routes';

export default function FaqPage() {
  return (
    <TenantShell title="FAQ">
      <PageIntro description="Answers about sign-in, your lease, repairs, inspections, rent, and moving out in the CROSSUB Tenant app." />

      <FaqSectionList sections={TENANT_FAQ_SECTIONS} />

      <div className="from-primary/10 via-card to-card mt-8 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br p-5 shadow-sm">
        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          Need more help?
        </p>
        <p className="mt-2 text-sm leading-relaxed">
          Your property manager can assist with anything not covered here.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Link
            href={ROUTES.MESSAGES_NEW}
            className="hover:border-primary/35 hover:bg-primary/5 flex items-center gap-3 rounded-xl border bg-background/80 px-4 py-3 text-sm font-medium transition-colors"
          >
            <span className="bg-primary/15 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
              <MessageSquare className="size-4" />
            </span>
            Send a message
          </Link>
          <Link
            href={ROUTES.TUTORIAL}
            className="hover:border-primary/35 hover:bg-primary/5 flex items-center gap-3 rounded-xl border bg-background/80 px-4 py-3 text-sm font-medium transition-colors"
          >
            <span className="bg-primary/15 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
              <BookOpen className="size-4" />
            </span>
            App tutorial
          </Link>
        </div>
      </div>
    </TenantShell>
  );
}
