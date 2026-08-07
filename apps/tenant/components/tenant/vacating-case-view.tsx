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
import { outgoingReport, statementDetail } from '@/constants/routes';
import { hrefWithFrom } from '@/lib/back-navigation';
import { OUTGOING_STATUS_LABEL } from '@/lib/tenant-labels';
import { needsVacatingRepairQuoteAction, needsVacatingSettlementAction } from '@/lib/end-leasing';
import type { VacatingCase, VacatingRepairQuoteSettlement } from '@/lib/types';
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

function RepairQuoteSettlementPanel({ summary }: { summary: VacatingRepairQuoteSettlement }) {
  const totalDeductions =
    summary.unpaidRent + summary.unpaidBills + summary.maintenanceCost;

  return (
    <div className="overflow-hidden rounded-xl border text-xs">
      <div className="divide-y">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-muted-foreground">Unpaid rent</span>
          <span className="font-medium tabular-nums">{formatCurrency(summary.unpaidRent)}</span>
        </div>
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-muted-foreground">Unpaid bills</span>
          <span className="font-medium tabular-nums">{formatCurrency(summary.unpaidBills)}</span>
        </div>
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-muted-foreground">Your repair items (bond deductible)</span>
          <span className="font-medium tabular-nums">
            {formatCurrency(summary.maintenanceCost)}
          </span>
        </div>
        <div className="flex items-center justify-between bg-muted/30 px-3 py-2">
          <span className="font-semibold">Total bond held</span>
          <span className="font-semibold tabular-nums">{formatCurrency(summary.bondHeld)}</span>
        </div>
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-muted-foreground">Less deductions</span>
          <span className="font-medium tabular-nums text-rose-600 dark:text-rose-400">
            −{formatCurrency(totalDeductions)}
          </span>
        </div>
        <div className="flex items-center justify-between bg-primary/5 px-3 py-2">
          <span className="font-semibold">
            {summary.debtAmount > 0 ? 'Amount owing' : 'Estimated refund'}
          </span>
          <span className="text-primary font-semibold tabular-nums">
            {summary.debtAmount > 0
              ? formatCurrency(summary.debtAmount)
              : formatCurrency(summary.netRefund)}
          </span>
        </div>
      </div>
    </div>
  );
}

function RepairQuoteAckPanel({
  vacating,
  busy,
  onAccept,
  onDecline,
}: {
  vacating: VacatingCase;
  busy: boolean;
  onAccept: () => void;
  onDecline: (reason: string) => void;
}) {
  const [declineReason, setDeclineReason] = useState('');
  const showActions = needsVacatingRepairQuoteAction(vacating);
  const repairItems = vacating.tenantResponsibilityItems ?? [];
  const repairSummary = vacating.repairQuoteSettlementSummary;

  return (
    <div className="rounded-xl border bg-card p-4 text-sm">
      <div className="mb-2 flex items-center gap-2 font-medium">
        <Wrench className="text-primary size-4" />
        Tenant responsibilities & bond deductions
      </div>
      <p className="text-muted-foreground text-xs">
        Your property manager listed items from the outgoing inspection. Bond-deductible items may
        be taken from your rental bond.
      </p>
      {repairItems.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-xl border text-xs">
          <table className="w-full text-left">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-semibold">Area</th>
                <th className="px-3 py-2 font-semibold">Description</th>
                <th className="px-3 py-2 font-semibold">Quote</th>
                <th className="px-3 py-2 font-semibold">Bond</th>
              </tr>
            </thead>
            <tbody>
              {repairItems.map((item, index) => (
                <tr key={`repair-item-${index}`} className="border-t align-top">
                  <td className="px-3 py-2">{item.area}</td>
                  <td className="px-3 py-2 whitespace-pre-wrap">{item.description}</td>
                  <td className="px-3 py-2 tabular-nums">{item.quote || '—'}</td>
                  <td className="px-3 py-2">
                    {item.bondDeductible ? 'Deductible' : 'Not deductible'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {repairSummary ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium">Bond calculation</p>
          <RepairQuoteSettlementPanel summary={repairSummary} />
        </div>
      ) : null}
      {vacating.tenantRepairQuoteStatus === 'accepted' ? (
        <p className="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          You agreed to these bond deductions. Maintenance jobs are being arranged.
        </p>
      ) : null}
      {vacating.tenantRepairQuoteStatus === 'declined' ? (
        <p className="mt-3 text-xs font-medium text-rose-600 dark:text-rose-400">
          You disagreed with the proposed bond deductions. Your agent will follow up.
        </p>
      ) : null}
      {showActions ? (
        <div className="mt-4 space-y-3 border-t border-border/60 pt-3">
          <p className="text-xs font-medium">Confirm bond deductions</p>
          <Button className="w-full" disabled={busy} onClick={onAccept}>
            I agree
          </Button>
          <textarea
            className="border-input bg-background w-full rounded-xl border px-3 py-2 text-sm"
            placeholder="Reason for disagreeing (optional)"
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
          />
          <Button
            variant="destructive"
            className="w-full"
            disabled={busy}
            onClick={() => onDecline(declineReason.trim())}
          >
            I disagree
          </Button>
        </div>
      ) : null}
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
  settlementBusy,
  onAcceptSettlement,
  onDeclineSettlement,
  attendanceBusy,
  onSetOutgoingAttendance,
}: {
  vacating: VacatingCase;
  dateValue: string;
  draftDate: string;
  setDraftDate: (v: string) => void;
  savingDate: boolean;
  onSaveDate: () => void;
  withdrawing: boolean;
  onWithdraw: () => void;
  settlementBusy: boolean;
  onAcceptSettlement: () => void;
  onDeclineSettlement: (reason: string) => void;
  attendanceBusy: boolean;
  onSetOutgoingAttendance: (attendance: 'yes' | 'no') => void;
}) {
  const stage = vacating.currentStage;
  const [declineReason, setDeclineReason] = useState('');
  const showSettlementActions = needsVacatingSettlementAction(vacating);
  const tenantAttendance = vacating.tenantOutgoingAttendance ?? 'pending';
  const attendanceLabel =
    tenantAttendance === 'yes' ? 'Yes' : tenantAttendance === 'no' ? 'No' : 'Not yet answered';

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
          <div className="mt-4 space-y-2 border-t border-border/60 pt-3">
            <p className="text-xs font-medium">Will you attend the outgoing inspection?</p>
            <p className="text-muted-foreground text-xs">
              Your property manager will see your answer in End Leasing and on the inspection job.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={tenantAttendance === 'yes' ? 'default' : 'outline'}
                disabled={attendanceBusy}
                onClick={() => onSetOutgoingAttendance('yes')}
              >
                Yes, I will attend
              </Button>
              <Button
                type="button"
                size="sm"
                variant={tenantAttendance === 'no' ? 'default' : 'outline'}
                disabled={attendanceBusy}
                onClick={() => onSetOutgoingAttendance('no')}
              >
                No, I will not attend
              </Button>
            </div>
            {tenantAttendance !== 'pending' && (
              <p className="text-muted-foreground text-xs">
                Your response: <span className="font-medium">{attendanceLabel}</span>
              </p>
            )}
          </div>
          {vacating.outgoingReportId && vacating.inspectionReportAvailable && (
            <Link
              href={hrefWithFrom(outgoingReport(vacating.outgoingReportId), 'vacating')}
              className="text-primary mt-3 inline-block text-xs font-medium"
            >
              Review outgoing report →
            </Link>
          )}
        </div>
      )}

      {stage === VACATING_STAGE.MAINTENANCE && !vacating.tenantBondAckSentAt && (
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
          {showSettlementActions && (
            <div className="mt-4 space-y-3 border-t border-border/60 pt-3">
              <p className="text-xs font-medium">Confirm bond settlement</p>
              <Button
                className="w-full"
                disabled={settlementBusy}
                onClick={onAcceptSettlement}
              >
                Accept proposed settlement
              </Button>
              <textarea
                className="border-input bg-background w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="Reason for declining (required)"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
              />
              <Button
                variant="destructive"
                className="w-full"
                disabled={settlementBusy || !declineReason.trim()}
                onClick={() => onDeclineSettlement(declineReason.trim())}
              >
                Decline settlement
              </Button>
            </div>
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
        {/* Move-out services — hidden until partner referrals are ready.
        <Button asChild variant="outline" size="sm">
          <Link href={ROUTES.MOVE_OUT_SERVICES}>Move-out services</Link>
        </Button>
        */}
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
  acceptVacatingSettlement,
  declineVacatingSettlement,
  acceptVacatingRepairQuote,
  declineVacatingRepairQuote,
  setVacatingOutgoingAttendance,
}: {
  vacating: VacatingCase;
  cancelVacatingCase: (reason?: string) => Promise<void>;
  updateVacateDate: (date: string) => Promise<void>;
  acceptVacatingSettlement: (caseId: string) => Promise<void>;
  declineVacatingSettlement: (caseId: string, reason: string) => Promise<void>;
  acceptVacatingRepairQuote: (caseId: string) => Promise<void>;
  declineVacatingRepairQuote: (caseId: string, reason?: string) => Promise<void>;
  setVacatingOutgoingAttendance: (attendance: 'yes' | 'no') => Promise<void>;
}) {
  const [withdrawing, setWithdrawing] = useState(false);
  const [draftDate, setDraftDate] = useState('');
  const [savingDate, setSavingDate] = useState(false);
  const [settlementBusy, setSettlementBusy] = useState(false);
  const [repairQuoteBusy, setRepairQuoteBusy] = useState(false);
  const [attendanceBusy, setAttendanceBusy] = useState(false);
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

  const handleSetOutgoingAttendance = async (attendance: 'yes' | 'no') => {
    setAttendanceBusy(true);
    try {
      await setVacatingOutgoingAttendance(attendance);
      toast.success(
        attendance === 'yes'
          ? 'Thanks — we noted you will attend the outgoing inspection'
          : 'Thanks — we noted you will not attend the outgoing inspection',
      );
    } finally {
      setAttendanceBusy(false);
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
          {vacating.tenantBondAckSentAt ? (
            <RepairQuoteAckPanel
              vacating={vacating}
              busy={repairQuoteBusy}
              onAccept={() => {
                setRepairQuoteBusy(true);
                void acceptVacatingRepairQuote(vacating.id)
                  .then(() => toast.success('Bond deductions accepted — maintenance will be arranged'))
                  .finally(() => setRepairQuoteBusy(false));
              }}
              onDecline={(reason) => {
                setRepairQuoteBusy(true);
                void declineVacatingRepairQuote(vacating.id, reason || undefined)
                  .then(() => toast.success('Response recorded — your agent will follow up'))
                  .finally(() => setRepairQuoteBusy(false));
              }}
            />
          ) : null}
          <PhasePanel
            vacating={vacating}
            dateValue={dateValue}
            draftDate={draftDate}
            setDraftDate={setDraftDate}
            savingDate={savingDate}
            onSaveDate={() => void handleDateSave()}
            withdrawing={withdrawing}
            onWithdraw={() => void handleWithdraw()}
            settlementBusy={settlementBusy}
            onAcceptSettlement={() => {
              setSettlementBusy(true);
              void acceptVacatingSettlement(vacating.id)
                .then(() => toast.success('Settlement accepted'))
                .finally(() => setSettlementBusy(false));
            }}
            onDeclineSettlement={(reason) => {
              setSettlementBusy(true);
              void declineVacatingSettlement(vacating.id, reason)
                .then(() => toast.success('Settlement declined — your agent will follow up'))
                .finally(() => setSettlementBusy(false));
            }}
            attendanceBusy={attendanceBusy}
            onSetOutgoingAttendance={(attendance) => void handleSetOutgoingAttendance(attendance)}
          />
        </>
      )}
    </div>
  );
}
