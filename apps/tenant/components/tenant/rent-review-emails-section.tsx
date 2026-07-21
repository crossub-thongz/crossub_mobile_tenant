'use client';

import { useState } from 'react';
import { ChevronRight, Mail } from 'lucide-react';

import {
  EmailPreviewDialog,
  type EmailPreviewContent,
} from '@/components/tenant/email-preview-dialog';
import { tenantRentReviewNoticePdfUrl } from '@/lib/crossub-api/tenant-account-client';
import type { RentReviewCase, RentReviewEmail } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

function emailKindLabel(kind: RentReviewEmail['kind']): string {
  return kind === 'notice' ? 'Formal notice' : 'Automated reminder';
}

function toPreviewContent(email: RentReviewEmail, review: RentReviewCase): EmailPreviewContent {
  const attachments =
    email.kind === 'notice' && review.noticeTerms?.noticePdfAvailable
      ? [
          {
            name: 'NSW-Fair-Trading-Notice.pdf',
            url: tenantRentReviewNoticePdfUrl(review.id),
          },
        ]
      : undefined;

  return {
    subject: email.subject,
    body: email.body,
    from: email.from,
    to: email.to,
    sentAt: email.sentAt,
    kindLabel: emailKindLabel(email.kind),
    attachments,
  };
}

function EmailRow({
  email,
  onSelect,
}: {
  email: RentReviewEmail;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="hover:bg-muted/30 flex w-full items-start gap-3 px-3 py-3 text-left transition-colors"
    >
      <span className="bg-primary/10 text-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full">
        <Mail className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{email.subject}</p>
        <p className="text-muted-foreground mt-0.5 truncate text-xs">
          {emailKindLabel(email.kind)} · sent {formatDateTime(email.sentAt)}
        </p>
      </div>
      <ChevronRight className="text-muted-foreground mt-2 size-4 shrink-0" />
    </button>
  );
}

export function RentReviewEmailsSection({ review }: { review: RentReviewCase }) {
  const [selected, setSelected] = useState<RentReviewEmail | null>(null);

  if (review.emails.length === 0) return null;

  return (
    <>
      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold">Emails from your property manager</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Formal notice and automated reminders sent to you about this rent review.
          </p>
        </div>

        <div className="divide-y">
          {review.emails.map((email, index) => (
            <EmailRow
              key={`${email.sentAt}-${email.kind}-${index}`}
              email={email}
              onSelect={() => setSelected(email)}
            />
          ))}
        </div>
      </section>

      <EmailPreviewDialog
        email={selected ? toPreviewContent(selected, review) : null}
        open={selected != null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </>
  );
}
