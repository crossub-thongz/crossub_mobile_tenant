'use client';

import { useState } from 'react';
import { CreditCard, Landmark } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import {
  DEMO_BANK_DETAILS,
  computeRentAmountDue,
  rentPaymentCycleHint,
  rentPaymentReference,
} from '@/lib/rent-payment';
import { formatCurrency } from '@/lib/utils';

export function PayRentCard() {
  const { user } = useAuth();
  const { lease, arrears, outstandingBalance, recordRentPayment } = useTenantData();
  const [submitting, setSubmitting] = useState(false);

  const amountDue = computeRentAmountDue(lease, arrears, outstandingBalance);

  if (!lease || amountDue == null) {
    return (
      <section className="rounded-xl border border-dashed bg-card p-4 text-sm">
        <p className="font-semibold">Pay rent</p>
        <p className="text-muted-foreground mt-2">
          Rent payments appear here once you have an active lease linked to your account. Browse
          listings to apply, or ask your agency to link your tenancy.
        </p>
      </section>
    );
  }

  const reference = rentPaymentReference(lease.id, user?.id ?? null);

  const onPay = async (method: 'bank_transfer' | 'card') => {
    setSubmitting(true);
    try {
      if (method === 'card') {
        toast.message('Card payments', {
          description:
            'Online card payments will connect when CROSSUB payment gateway is live. Use bank transfer below for now.',
        });
        return;
      }
      const receipt = recordRentPayment({ method, amount: amountDue });
      toast.success('Payment recorded', {
        description: `Receipt ${receipt.receiptNumber} — allow 1–2 business days for bank transfer to clear.`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="pay-rent" className="rounded-xl border bg-card p-4">
      <p className="font-semibold">Pay rent</p>
      <p className="text-primary mt-1 text-2xl font-semibold">{formatCurrency(amountDue)}</p>
      <p className="text-muted-foreground mt-1 text-xs">
        {arrears || outstandingBalance
          ? 'Outstanding amount due'
          : rentPaymentCycleHint(lease)}
      </p>

      <div className="bg-muted/50 mt-4 space-y-2 rounded-lg p-3 text-sm">
        <p className="text-muted-foreground text-xs font-medium uppercase">Bank transfer</p>
        <p>
          <span className="text-muted-foreground">Account name: </span>
          {DEMO_BANK_DETAILS.accountName}
        </p>
        <p>
          <span className="text-muted-foreground">BSB: </span>
          {DEMO_BANK_DETAILS.bsb}
        </p>
        <p>
          <span className="text-muted-foreground">Account: </span>
          {DEMO_BANK_DETAILS.accountNumber}
        </p>
        <p>
          <span className="text-muted-foreground">PayID: </span>
          {DEMO_BANK_DETAILS.payId}
        </p>
        <p>
          <span className="text-muted-foreground">Reference (required): </span>
          <strong className="font-mono text-xs">{reference}</strong>
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <Button
          className="w-full"
          disabled={submitting}
          onClick={() => void onPay('bank_transfer')}
        >
          <Landmark className="size-4" />
          I&apos;ve paid by bank transfer
        </Button>
        <Button
          variant="outline"
          className="w-full"
          disabled={submitting}
          onClick={() => void onPay('card')}
        >
          <CreditCard className="size-4" />
          Pay by card (coming soon)
        </Button>
      </div>
      <p className="text-muted-foreground mt-3 text-xs">
        After you pay, tap &quot;I&apos;ve paid&quot; so Accounting can match your transfer. A receipt
        will appear below once recorded.
      </p>
    </section>
  );
}
