'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  HardHat,
  ImageIcon,
  ListTree,
  MessageSquare,
  Phone,
  Scale,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';

import { MaintenanceMediaGallery } from '@/components/maintenance/maintenance-media-gallery';
import { TenantMaintenanceCompletionPopup } from '@/components/maintenance/tenant-maintenance-completion-popup';
import { TenantMaintenanceStrataContacts } from '@/components/maintenance/tenant-maintenance-strata-contacts';
import {
  responsibilityLabel,
  TenantMaintenanceResponsibilityAckTimer,
} from '@/components/maintenance/tenant-maintenance-responsibility-ack';
import { TenantShell } from '@/components/layout/tenant-shell';
import { InfoCard } from '@/components/tenant/info-card';
import { SegmentTabs } from '@/components/tenant/segment-tabs';
import { StatusBadge } from '@/components/tenant/status-badge';
import { Button } from '@/components/ui/button';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { messageDetail, ROUTES } from '@/constants/routes';
import { SCHEDULE_DECISION, type ScheduleDecision } from '@/constants/maintenance-schedule';
import { MAINTENANCE_TENANT_FINISHED_STATUSES } from '@/constants/maintenance-status';
import {
  MAX_RESPONSIBILITY_DECLINE_REASON_LENGTH,
  MIN_RESPONSIBILITY_DECLINE_REASON_LENGTH,
} from '@/constants/maintenance-responsibility';
import {
  clearScheduleDecision,
  isNewProposalRound,
  readScheduleDecision,
  saveScheduleDecision,
  type StoredScheduleDecision,
} from '@/lib/maintenance-schedule-decision';
import { cn, formatDateTime } from '@/lib/utils';

type Tab = 'overview' | 'status' | 'message';

export default function RepairDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { maintenance, messages, approveRepairCompletion, respondToMaintenanceSchedule, respondMaintenanceResponsibilityAck, refresh } =
    useTenantData();
  const request = maintenance.find((m) => m.id === id);
  const thread = messages.find((m) => m.linkedCaseId === id);
  const [tab, setTab] = useState<Tab>('overview');
  const [submittingAck, setSubmittingAck] = useState(false);
  // Disagreeing is a two-step action: the first tap opens the reason, the second submits it.
  const [declineFormOpen, setDeclineFormOpen] = useState(false);
  const [responsibilityDeclineReason, setResponsibilityDeclineReason] = useState('');
  const [submittingCompletion, setSubmittingCompletion] = useState(false);
  const [submittingSchedule, setSubmittingSchedule] = useState(false);
  const scheduleActionInFlight = useRef(false);
  const [scheduleDecision, setScheduleDecision] = useState<ScheduleDecision | null>(null);
  const [storedScheduleDecision, setStoredScheduleDecision] =
    useState<StoredScheduleDecision | null>(null);
  const [scheduleHydrated, setScheduleHydrated] = useState(false);
  const [scheduleDeclineReason, setScheduleDeclineReason] = useState('');
  const [completionPopupOpen, setCompletionPopupOpen] = useState(false);

  const needsCompletionApproval =
    request?.completionApprovalPending && !request.tenantCompletionApproved;
  const needsScheduleApproval = request?.scheduleApprovalPending === true;
  const proposedTimes = request?.scheduleProposedTimes?.trim() ?? '';

  // A fresh set of proposed times supersedes whatever the tenant answered last round.
  const supersededByNewRound = isNewProposalRound(storedScheduleDecision, proposedTimes);
  const recordedDecision: ScheduleDecision | null =
    scheduleDecision ?? (supersededByNewRound ? null : storedScheduleDecision?.decision ?? null);

  // Once answered the card becomes read-only, regardless of what the next poll reports —
  // re-arming it is what let repeat clicks re-trigger the contractor email.
  const scheduleAwaitingResponse =
    !recordedDecision && needsScheduleApproval && Boolean(proposedTimes);
  const repairFinished = MAINTENANCE_TENANT_FINISHED_STATUSES.some(
    (s) => s === request?.status,
  );
  const showScheduleApprovalCard =
    scheduleAwaitingResponse || (Boolean(recordedDecision) && !repairFinished);
  // Stay locked until the persisted decision has been read, so the first paint after a
  // reload cannot offer a live button for an already-answered proposal.
  const scheduleActionsLocked =
    submittingSchedule || Boolean(recordedDecision) || !scheduleHydrated;
  const decidedTimes = storedScheduleDecision?.proposedTimes || proposedTimes;
  const needsResponsibilityAck = request?.responsibilityAckRequired === true;
  const responsibilityText = responsibilityLabel(request?.responsibility);

  useEffect(() => {
    if (needsCompletionApproval && request?.completionEvidenceUploaded) {
      setCompletionPopupOpen(true);
    } else {
      setCompletionPopupOpen(false);
    }
  }, [needsCompletionApproval, request?.completionEvidenceUploaded, request?.id]);

  // Rehydrate the persisted decision so a reload (tenants re-enter from the email link)
  // does not present live buttons for a proposal they already answered.
  useEffect(() => {
    if (!request?.id) return;
    setScheduleDecision(null);
    setScheduleDeclineReason('');
    scheduleActionInFlight.current = false;
    setStoredScheduleDecision(readScheduleDecision(request.id));
    setScheduleHydrated(true);
  }, [request?.id]);

  // Contractor proposed new times — drop the stale record and re-arm the card.
  useEffect(() => {
    if (!request?.id) return;
    if (!isNewProposalRound(storedScheduleDecision, proposedTimes)) return;
    clearScheduleDecision(request.id);
    setStoredScheduleDecision(null);
    setScheduleDecision(null);
    setScheduleDeclineReason('');
    scheduleActionInFlight.current = false;
  }, [request?.id, proposedTimes, storedScheduleDecision]);

  const handleResponsibilityAck = async (agreed: boolean) => {
    if (!request) return;
    const reason = responsibilityDeclineReason.trim();
    // The case closes on this answer and does not reopen, so a disagreement has to carry the
    // tenant's own words — it is the only thing the officer who picks it up has to work from.
    if (!agreed && reason.length < MIN_RESPONSIBILITY_DECLINE_REASON_LENGTH) {
      toast.error('Please tell us why you disagree before submitting.');
      return;
    }
    setSubmittingAck(true);
    try {
      await respondMaintenanceResponsibilityAck(request.id, agreed, agreed ? undefined : reason);
      toast.success(
        agreed
          ? 'You acknowledged this repair is your responsibility.'
          : 'Your disagreement and reason were sent to CROSSUB.',
      );
      setDeclineFormOpen(false);
      setResponsibilityDeclineReason('');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not record your response. Try again.',
      );
    } finally {
      setSubmittingAck(false);
    }
  };

  const handleCompletionApproval = async () => {
    if (!request) return;
    setSubmittingCompletion(true);
    try {
      await approveRepairCompletion(request.id);
      toast.success('Repair completion confirmed');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not record your approval. Try again.',
      );
    } finally {
      setSubmittingCompletion(false);
    }
  };

  const handleScheduleApproval = async () => {
    if (!request || scheduleActionInFlight.current || recordedDecision) return;
    const times = proposedTimes;
    scheduleActionInFlight.current = true;
    setSubmittingSchedule(true);
    setScheduleDecision(SCHEDULE_DECISION.APPROVED);
    try {
      await respondToMaintenanceSchedule(request.id, SCHEDULE_DECISION.APPROVED);
      saveScheduleDecision(request.id, SCHEDULE_DECISION.APPROVED, times);
      setStoredScheduleDecision(readScheduleDecision(request.id));
      toast.success('Visit time approved — contractor has been notified');
    } catch (err) {
      setScheduleDecision(null);
      scheduleActionInFlight.current = false;
      toast.error(err instanceof Error ? err.message : 'Could not approve visit time');
    } finally {
      setSubmittingSchedule(false);
    }
  };

  const handleScheduleDecline = async () => {
    if (!request || scheduleActionInFlight.current || recordedDecision) return;
    if (!scheduleDeclineReason.trim()) {
      toast.error('Please tell us why this time does not work');
      return;
    }
    const times = proposedTimes;
    scheduleActionInFlight.current = true;
    setSubmittingSchedule(true);
    setScheduleDecision(SCHEDULE_DECISION.DECLINED);
    try {
      await respondToMaintenanceSchedule(
        request.id,
        SCHEDULE_DECISION.DECLINED,
        scheduleDeclineReason.trim(),
      );
      saveScheduleDecision(request.id, SCHEDULE_DECISION.DECLINED, times);
      setStoredScheduleDecision(readScheduleDecision(request.id));
      toast.success('Visit time declined — contractor will propose new times');
      setScheduleDeclineReason('');
    } catch (err) {
      setScheduleDecision(null);
      scheduleActionInFlight.current = false;
      toast.error(err instanceof Error ? err.message : 'Could not decline visit time');
    } finally {
      setSubmittingSchedule(false);
    }
  };

  if (!request) {
    return (
      <TenantShell title="Repair" backHref={ROUTES.REPAIRS}>
        <p className="text-sm text-muted-foreground">Repair not found.</p>
      </TenantShell>
    );
  }

  return (
    <TenantShell title={request.trackingNumber} backHref={ROUTES.REPAIRS}>
      <div className={cn('space-y-4', needsResponsibilityAck && 'pb-36')}>
        {/* Progress hero */}
        <div className="from-primary/15 via-card to-card rounded-2xl border border-primary/20 bg-gradient-to-br p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Repair progress
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums">
                {request.progressPercent}%
              </p>
            </div>
            <StatusBadge label={request.statusLabel} variant="action" />
          </div>
          <div className="bg-secondary/80 mt-4 h-2.5 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${request.progressPercent}%` }}
            />
          </div>
          <p className="text-muted-foreground mt-2 text-xs">{request.trackingNumber}</p>
          {request.statusHint && (
            <p className="text-muted-foreground mt-2 break-words text-sm leading-relaxed">
              {request.statusHint}
            </p>
          )}
        </div>

        {responsibilityText && (
          <InfoCard icon={Scale} label="Responsibility">
            <p className="font-semibold">{responsibilityText}</p>
            {request.responsibility === 'tenant' && (
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                CROSSUB has classified this repair as your responsibility. You will need to
                arrange your own contractor to resolve it.
              </p>
            )}
            {request.responsibility === 'landlord' && (
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                The landlord is responsible for this repair. CROSSUB will coordinate quotes and
                contractors.
              </p>
            )}
            {request.responsibility === 'strata' && (
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                This repair falls under strata responsibility. CROSSUB will coordinate with the
                strata body.
              </p>
            )}
          </InfoCard>
        )}

        {request.responsibility === 'strata' &&
        request.status !== 'completed' &&
        request.status !== 'closed' ? (
          <TenantMaintenanceStrataContacts
            buildingManager={request.buildingManager}
            strataContact={request.strataContact}
            strataPlanNumber={request.strataPlanNumber}
            buildingName={request.buildingName}
          />
        ) : null}

        {/* Property */}
        <InfoCard icon={Building2} label="Property">
          <p className="font-medium leading-snug">{request.propertyAddress}</p>
        </InfoCard>

        {/* Repair request */}
        <InfoCard icon={Wrench} label="Repair request">
          <p className="text-lg font-semibold">{request.category}</p>
          <p className="mt-3 text-sm leading-relaxed">{request.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge label={request.urgency} priority={request.urgency} />
          </div>
          {request.scheduledAt && (
            <div className="bg-primary/10 text-primary mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium">
              <CalendarClock className="size-4 shrink-0" />
              Scheduled {formatDateTime(request.scheduledAt)}
            </div>
          )}
        </InfoCard>

        {/* Contractor */}
        {request.contractorName && (
          <InfoCard icon={HardHat} label="Assigned contractor" accent="primary">
            <p className="font-semibold">{request.contractorName}</p>
            {request.contractorPhone && (
              <a
                href={`tel:${request.contractorPhone.replace(/\s/g, '')}`}
                className="text-primary mt-2 inline-flex items-center gap-2 text-sm font-medium"
              >
                <Phone className="size-4" />
                {request.contractorPhone}
              </a>
            )}
          </InfoCard>
        )}

        {showScheduleApprovalCard &&
          (recordedDecision === SCHEDULE_DECISION.APPROVED ? (
            <InfoCard icon={CheckCircle2} label="Confirmed schedule" accent="primary">
              <p className="text-primary flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="size-4 shrink-0" />
                You approved this visit time
              </p>
              {decidedTimes && (
                <p className="text-muted-foreground mt-3 whitespace-pre-wrap text-sm">
                  {decidedTimes}
                </p>
              )}
              {request.scheduledAt && (
                <div className="bg-primary/10 text-primary mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium">
                  <CalendarClock className="size-4 shrink-0" />
                  Visit confirmed for {formatDateTime(request.scheduledAt)}
                </div>
              )}
              <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
                The contractor has been notified. No further action is needed — you will be
                contacted if the visit time changes.
              </p>
            </InfoCard>
          ) : recordedDecision === SCHEDULE_DECISION.DECLINED ? (
            <InfoCard icon={CalendarClock} label="Visit time declined">
              <p className="text-sm font-semibold">You declined the proposed times</p>
              {decidedTimes && (
                <p className="text-muted-foreground mt-3 whitespace-pre-wrap text-sm line-through">
                  {decidedTimes}
                </p>
              )}
              <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
                The contractor has been notified and will propose new times. This section will
                reopen when new times arrive.
              </p>
            </InfoCard>
          ) : (
            <InfoCard icon={CalendarClock} label="Approve visit time" accent="primary">
              <p className="text-muted-foreground text-xs leading-relaxed">
                The contractor proposed the following times to attend your property:
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm font-medium">{proposedTimes}</p>
              <div className="mt-4 grid gap-2">
                <Button
                  disabled={scheduleActionsLocked}
                  onClick={() => void handleScheduleApproval()}
                >
                  {submittingSchedule ? 'Submitting…' : 'Approve visit time'}
                </Button>
                <textarea
                  className="border-input bg-background flex min-h-[72px] w-full rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="Reason if declining (required to decline)"
                  value={scheduleDeclineReason}
                  disabled={scheduleActionsLocked}
                  onChange={(e) => setScheduleDeclineReason(e.target.value)}
                />
                <Button
                  variant="outline"
                  disabled={scheduleActionsLocked}
                  onClick={() => void handleScheduleDecline()}
                >
                  Decline proposed time
                </Button>
              </div>
            </InfoCard>
          ))}

        {request.completionEvidenceUploaded && (
          <InfoCard icon={CheckCircle2} label="Completion evidence" accent="primary">
            <p className="text-muted-foreground mb-3 text-xs">
              Photos and videos uploaded by the contractor or property manager when the repair
              was marked complete.
            </p>
            <MaintenanceMediaGallery photos={request.completionEvidenceUrls} />
            {needsCompletionApproval ? (
              <div className="mt-4 space-y-2 border-t border-primary/15 pt-4">
                <p className="text-sm font-medium">Confirm you are satisfied with the work</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Review the completion evidence above, then approve when the repair meets your
                  expectations.
                </p>
                <Button
                  className="w-full"
                  disabled={submittingCompletion}
                  onClick={() => void handleCompletionApproval()}
                >
                  Approve repair completed
                </Button>
              </div>
            ) : request.tenantCompletionApproved ? (
              <p className="text-primary mt-4 text-sm font-medium">
                You approved this completion.
              </p>
            ) : null}
          </InfoCard>
        )}

        <SegmentTabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'overview', label: 'Overview', icon: ClipboardList },
            { id: 'status', label: 'Status', icon: ListTree },
            { id: 'message', label: 'Message', icon: MessageSquare },
          ]}
        />

        {tab === 'overview' && (
          <div className="space-y-3">
            <InfoCard label="Details">
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground text-xs uppercase">Description</dt>
                  <dd className="mt-1 leading-relaxed">{request.description}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs uppercase">Urgency</dt>
                  <dd className="mt-1 capitalize">{request.urgency}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs uppercase">Status</dt>
                  <dd className="mt-1">{request.statusLabel}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs uppercase">Submitted</dt>
                  <dd className="mt-1">{formatDateTime(request.createdAt)}</dd>
                </div>
              </dl>
            </InfoCard>

            <InfoCard icon={ImageIcon} label="Photos & videos">
              <p className="text-muted-foreground mb-3 text-xs">
                Evidence you uploaded when filing this repair.
              </p>
              <MaintenanceMediaGallery photos={request.photos} />
            </InfoCard>
          </div>
        )}

        {tab === 'status' && (
          <div className="relative space-y-0 pl-2">
            {request.timeline.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Status updates will appear here as CROSSUB progresses your repair.
              </p>
            ) : (
              request.timeline.map((entry, i) => (
                <div key={entry.id} className="relative flex gap-4 pb-5 last:pb-0">
                  {i < request.timeline.length - 1 && (
                    <span className="bg-border absolute top-3 left-[7px] h-[calc(100%-4px)] w-px" />
                  )}
                  <span className="bg-primary relative z-10 mt-1.5 size-3.5 shrink-0 rounded-full ring-4 ring-background" />
                  <div className="min-w-0 flex-1 rounded-xl border bg-card px-3 py-2.5">
                    <p className="break-words font-medium">{entry.title}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {entry.actor} · {formatDateTime(entry.at)}
                    </p>
                    {entry.detail && (
                      <p className="text-muted-foreground mt-1 break-words text-xs">{entry.detail}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'message' && (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Contact CROSSUB or your assigned contractor about this repair.
            </p>
            {thread && (
              <Button asChild variant="secondary" className="w-full">
                <Link href={messageDetail(thread.id)}>
                  <MessageSquare className="size-4" />
                  Open repair message thread
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" className="w-full">
              <Link href={`${ROUTES.MESSAGES_NEW}?to=agent&category=maintenance`}>
                Message CROSSUB
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={`${ROUTES.MESSAGES_NEW}?to=contractor&category=maintenance`}>
                <HardHat className="size-4" />
                Message contractor
              </Link>
            </Button>
          </div>
        )}
      </div>

      {needsResponsibilityAck && (
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-full max-w-lg -translate-x-1/2 border-t border-amber-500/30 bg-background/95 px-4 py-4 backdrop-blur">
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-card p-4">
            <p className="font-semibold">Acknowledgement required</p>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              Please confirm you accept this is your responsibility and will arrange your own
              contractor. If you disagree, tell us why — the case stays open and your property
              manager reviews your reason.
            </p>
            {request.responsibilityAckDeadline && (
              <div className="mt-3">
                <TenantMaintenanceResponsibilityAckTimer
                  deadline={request.responsibilityAckDeadline}
                  onExpire={() => {
                    void refresh();
                  }}
                />
              </div>
            )}
            {declineFormOpen ? (
              <div className="mt-4 space-y-2">
                <label htmlFor="responsibility-decline-reason" className="text-sm font-medium">
                  Why do you disagree?
                </label>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Tell us what you think caused the issue, or why it is not yours to fix. This
                  goes straight to your property manager with the case.
                </p>
                <textarea
                  id="responsibility-decline-reason"
                  autoFocus
                  className="border-input bg-background flex min-h-[88px] w-full rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="e.g. The oven door was already broken when we moved in — it is on the ingoing report."
                  maxLength={MAX_RESPONSIBILITY_DECLINE_REASON_LENGTH}
                  value={responsibilityDeclineReason}
                  disabled={submittingAck}
                  onChange={(e) => setResponsibilityDeclineReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={submittingAck}
                    onClick={() => {
                      setDeclineFormOpen(false);
                      setResponsibilityDeclineReason('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={
                      submittingAck ||
                      responsibilityDeclineReason.trim().length <
                        MIN_RESPONSIBILITY_DECLINE_REASON_LENGTH
                    }
                    onClick={() => void handleResponsibilityAck(false)}
                  >
                    {submittingAck ? 'Sending…' : 'Submit disagreement'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex gap-2">
                <Button
                  className="flex-1"
                  disabled={submittingAck}
                  onClick={() => void handleResponsibilityAck(true)}
                >
                  I agree
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={submittingAck}
                  onClick={() => setDeclineFormOpen(true)}
                >
                  I disagree
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <TenantMaintenanceCompletionPopup
        open={completionPopupOpen}
        onOpenChange={setCompletionPopupOpen}
        trackingNumber={request.trackingNumber}
      />
    </TenantShell>
  );
}
