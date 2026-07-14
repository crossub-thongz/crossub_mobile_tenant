'use client';

import { useState } from 'react';
import { ChevronRight, Mail } from 'lucide-react';

import type { RentReviewCase, RentReviewEmail } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

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
          {email.kind === 'notice' ? 'Formal notice' : 'Automated reminder'} · sent{' '}
          {formatDateTime(email.sentAt)}
        </p>
      </div>
      <ChevronRight className="text-muted-foreground mt-2 size-4 shrink-0" />
    </button>
  );
}

function EmailPreview({ email }: { email: RentReviewEmail }) {
  return (
    <div className="space-y-3 text-sm">
      <div>
        <p className="font-medium leading-snug">{email.subject}</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Sent {formatDateTime(email.sentAt)}
        </p>
      </div>
      <dl className="grid gap-2 text-xs">
        <div>
          <dt className="text-muted-foreground">From</dt>
          <dd className="font-medium">{email.from}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">To</dt>
          <dd className="font-medium">{email.to}</dd>
        </div>
      </dl>
      <div className="rounded-xl border bg-muted/20 p-3">
        <pre className="text-foreground/90 whitespace-pre-wrap font-sans text-xs leading-relaxed">
          {email.body}
        </pre>
      </div>
    </div>
  );
}

export function RentReviewEmailsSection({ review }: { review: RentReviewCase }) {
  const [selected, setSelected] = useState<RentReviewEmail | null>(null);

  if (review.emails.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="border-b px-4 py-3">
        <p className="text-sm font-semibold">Emails from your property manager</p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Formal notice and automated reminders sent to you about this rent review.
        </p>
      </div>

      {selected ? (
        <div className="p-4">
          <button
            type="button"
            className="text-primary mb-3 text-xs font-medium"
            onClick={() => setSelected(null)}
          >
            ← All emails
          </button>
          <EmailPreview email={selected} />
        </div>
      ) : (
        <div className="divide-y">
          {review.emails.map((email, index) => (
            <EmailRow
              key={`${email.sentAt}-${email.kind}-${index}`}
              email={email}
              onSelect={() => setSelected(email)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
