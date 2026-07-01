'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { KeyRound, Landmark, ClipboardList, Wrench } from 'lucide-react';

import { useTenantData } from '@/components/providers/tenant-data-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  VACATING_STAGE,
  VACATING_STAGE_LABEL,
  VACATING_STAGE_ORDER,
  VACATING_STAGE_SHORT,
  type VacatingStage,
} from '@/constants/vacating';
import { outgoingReport, ROUTES, statementDetail } from '@/constants/routes';
import { hrefWithFrom } from '@/lib/back-navigation';
import { OUTGOING_STATUS_LABEL } from '@/lib/tenant-labels';
import type { VacatingCase } from '@/lib/types';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

function vacateDateLabel(date: string, changed?: boolean): string {
  const base = formatDate(date);
  return changed ? `${base} (changed)` : base;
}

function stageIndex(stage: VacatingStage): number {
  return VACATING_STAGE_ORDER.indexOf(stage);
}

function StageRail({ current }: { current: VacatingStage }) {
  const idx = stageIndex(current);
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-1.5">
      {VACATING_STAGE_ORDER.map((stage, i) => {
        const active = stage === current;
        const done = i < idx;
        return (
          <div
            key={stage}
            className={cn(
              'min-w-[4.5rem] flex-1 rounded-lg px-2 py-2 text-center text-[10px] font-medium',
              active && 'bg-primary/15 text-primary',
              done && !active && 'text-emerald-600 dark:text-emerald-400',
              !active && !done && 'text-muted-foreground',
            )}
          >
            {VACATING_STAGE_SHORT[stage]}
          </div>
        );
      })}
    </div>
  );
}

function PhasePanel({
  vacating,
  dateValue,
  draftDate,
  setDraftDate,
  savingDate,
  onSaveDate,
  withdrawing,
  onWithdraw,
}: {
  vacating: VacatingCase;
  dateValue: string;
  draftDate: string;
  setDraftDate: (v: string) => void;
  savingDate: boolean;
  onSaveDate: () => void;
  withdrawing: boolean;
  onWithdraw: () => void;
}) {
  const stage = vacating.currentStage;

  return (
    <div className="space-y-3">
      {stage === VACATING_STAGE.KEY_RETURN && (
        <div className="rounded-xl border bg-card p-4 text-sm">
          <div className="mb-2 flex items-center gap-2 font-medium">
            <KeyRound className="text-primary size-4" />
            Key return
          </div>
          <p className="text-muted-foreground text-xs">
            Confirm your vacate date. Return keys, remotes and access devices on or before this
            date.
          </p>
          <p className="mt-3 font-semibold">
            Vacate {vacateDateLabel(vacating.vacatingDate, vacating.vacateDateChanged)}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Keys returned: {vacating.keysReturned ? 'Yes' : 'Not yet'}
          </p>
          <div className="mt-4 space-y-2 border-t border-border/60 pt-3">
            <p className="text-xs font-medium">Change vacate date</p>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="date"
                value={dateValue}
                onChange={(e) => setDraftDate(e.target.value)}
                className="h-9 w-auto text-xs"
              />
              <Button
                type="button"
                size="sm"
                disabled={savingDate || !dateValue}
                onClick={onSaveDate}
              >
                {savingDate ? 'Saving…' : 'Save date'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {stage === VACATING_STAGE.OUTGOING_INSPECTION && (
        <div className="rounded-xl border bg-card p-4 text-sm">
          <div className="mb-2 flex items-center gap-2 font-medium">
            <ClipboardList className="text-primary size-4" />
            Outgoing inspection
          </div>
          <p className="text-muted-foreground text-xs">
            {vacating.inspectionDate
              ? `Scheduled ${formatDate(vacating.inspectionDate)}`
              : 'Your outgoing inspection will be scheduled after key return.'}
          </p>
          <p className="mt-2 text-xs">{OUTGOING_STATUS_LABEL[vacating.outgoingStatus]}</p>
          {vacating.outgoingReportId && (
            <Link
              href={hrefWithFrom(outgoingReport(vacating.outgoingReportId), 'vacating')}
              className="text-primary mt-3 inline-block text-xs font-medium"
            >
              Review outgoing report →
            </Link>
          )}
        </div>
      )}

      {stage === VACATING_STAGE.MAINTENANCE && (
        <div className="rounded-xl border bg-card p-4 text-sm">
          <div className="mb-2 flex items-center gap-2 font-medium">
            <Wrench className="text-primary size-4" />
            Make-good
          </div>
          <p className="text-muted-foreground text-xs">
            Any tenant-chargeable repairs from the outgoing inspection are being finalised. Your
            agent will update the bond settlement once complete.
          </p>
        </div>
      )}

      {stage === VACATING_STAGE.BOND && (
        <div className="rounded-xl border bg-card p-4 text-sm">
          <div className="mb-2 flex items-center gap-2 font-medium">
            <Landmark className="text-primary size-4" />
            Bond & settlement
          </div>
          {vacating.refundAmount != null && (
            <p className="mt-1 font-semibold text-emerald-600 dark:text-emerald-400">
              Refund: {formatCurrency(vacating.refundAmount)}
            </p>
          )}
          {vacating.debtAmount != null && vacating.debtAmount > 0 && (
            <p className="mt-1 font-semibold text-rose-600 dark:text-rose-400">
              Owing: {formatCurrency(vacating.debtAmount)}
            </p>
          )}
          <p className="text-muted-foreground mt-2 text-xs">
            Settlement: {vacating.tenantSettlementStatus}
            {vacating.tenantConfirmationDueAt &&
              ` · respond by ${formatDate(vacating.tenantConfirmationDueAt)}`}
          </p>
          {vacating.bondRefundPaid && (
            <p className="mt-2 text-xs font-medium text-emerald-600">Bond refund processed</p>
          )}
          <Link
            href={statementDetail()}
            className="text-primary mt-3 inline-block text-xs font-medium"
          >
            View final statement →
          </Link>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={ROUTES.MOVE_OUT_SERVICES}>Move-out services</Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive"
          disabled={withdrawing}
          onClick={onWithdraw}
        >
          {withdrawing ? 'Withdrawing…' : 'Delete vacating case'}
        </Button>
      </div>
    </div>
  );
}

export function VacatingStartForm({
  onStart,
  loading,
}: {
  onStart: (date: string) => Promise<void>;
  loading?: boolean;
}) {
  const [date, setDate] = useState('');

  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <p className="text-sm font-medium">Start vacating</p>
      <p className="text-muted-foreground text-xs">
        Open an end-of-lease case on your property. Your agent will see the same workflow in End
        Leasing.
      </p>
      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <Button
        className="w-full"
        disabled={!date || loading}
        onClick={() => void onStart(date)}
      >
        {loading ? 'Starting…' : 'Confirm vacate date'}
      </Button>
    </div>
  );
}

export function VacatingCaseView({
  vacating,
  cancelVacatingCase,
  updateVacateDate,
}: {
  vacating: VacatingCase;
  cancelVacatingCase: (reason?: string) => Promise<void>;
  updateVacateDate: (date: string) => Promise<void>;
}) {
  const [withdrawing, setWithdrawing] = useState(false);
  const [draftDate, setDraftDate] = useState('');
  const [savingDate, setSavingDate] = useState(false);
  const isDeleted = vacating.status === 'cancelled';
  const dateValue = draftDate || vacating.vacatingDate.slice(0, 10);

  const handleWithdraw = async () => {
    if (
      !window.confirm(
        'Withdraw your vacating request? Staff will see this case marked as deleted.',
      )
    ) {
      return;
    }
    setWithdrawing(true);
    try {
      await cancelVacatingCase('Tenant no longer vacating');
      toast.success('Vacating withdrawn — you can start a new case anytime');
    } finally {
      setWithdrawing(false);
    }
  };

  const handleDateSave = async () => {
    if (!dateValue) return;
    setSavingDate(true);
    try {
      await updateVacateDate(dateValue);
      setDraftDate('');
    } finally {
      setSavingDate(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4 text-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{vacating.propertyAddress}</p>
            <p className="text-muted-foreground mt-1">
              {VACATING_STAGE_LABEL[vacating.currentStage]}
            </p>
            {vacating.terminationReason && (
              <p className="text-muted-foreground mt-1 text-xs">{vacating.terminationReason}</p>
            )}
          </div>
          {isDeleted && (
            <span className="rounded-full border border-rose-500/35 bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-800 dark:text-rose-200">
              Deleted
            </span>
          )}
        </div>
        {isDeleted && (
          <p className="text-muted-foreground mt-3 text-xs">
            Withdrawn
            {vacating.cancellationReason ? ` — ${vacating.cancellationReason}` : '.'}
          </p>
        )}
      </div>

      {!isDeleted && (
        <>
          <StageRail current={vacating.currentStage} />
          <PhasePanel
            vacating={vacating}
            dateValue={dateValue}
            draftDate={draftDate}
            setDraftDate={setDraftDate}
            savingDate={savingDate}
            onSaveDate={() => void handleDateSave()}
            withdrawing={withdrawing}
            onWithdraw={() => void handleWithdraw()}
          />
        </>
      )}
    </div>
  );
}
