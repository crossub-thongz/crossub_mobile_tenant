import { VACATING_STAGE, type VacatingStage } from '@/constants/vacating';
import type { VacatingCase } from '@/lib/types';

/** Whether the tenant must accept or decline the compare-step responsibility list. */
export function needsVacatingResponsibilityReviewAction(vacating: VacatingCase): boolean {
  return (
    vacating.status === 'open' &&
    vacating.tenantResponsibilityReviewStatus === 'pending'
  );
}

/** Default tab after load — bond once make-good responsibilities are acknowledged. */
export function resolveVacatingViewStage(vacating: VacatingCase): VacatingStage {
  if (
    vacating.tenantResponsibilityReviewStatus === 'accepted' &&
    !needsVacatingResponsibilityReviewAction(vacating)
  ) {
    return VACATING_STAGE.BOND;
  }
  if (needsVacatingRepairQuoteAction(vacating)) {
    return VACATING_STAGE.BOND;
  }
  if (needsVacatingSettlementAction(vacating)) {
    return VACATING_STAGE.BOND;
  }
  if (vacating.currentStage === VACATING_STAGE.BOND) {
    return VACATING_STAGE.BOND;
  }
  return vacating.currentStage;
}

/** Furthest step the tenant may open in the step rail (includes completed steps). */
export function maxAccessibleVacatingStageIndex(vacating: VacatingCase): number {
  const order = [
    VACATING_STAGE.KEY_RETURN,
    VACATING_STAGE.OUTGOING_INSPECTION,
    VACATING_STAGE.MAINTENANCE,
    VACATING_STAGE.BOND,
  ] as const;
  let idx = order.indexOf(vacating.currentStage);
  if (idx < 0) idx = 0;
  if (vacating.tenantResponsibilityReviewStatus === 'accepted') {
    idx = Math.max(idx, order.indexOf(VACATING_STAGE.BOND));
  }
  if (vacating.tenantBondAckSentAt) {
    idx = Math.max(idx, order.indexOf(VACATING_STAGE.BOND));
  }
  return idx;
}

/** Whether the tenant must accept or decline bond-deduction items from the quote step. */
export function needsVacatingRepairQuoteAction(vacating: VacatingCase): boolean {
  return (
    vacating.status === 'open' &&
    vacating.tenantRepairQuoteStatus === 'pending' &&
    Boolean(vacating.tenantBondAckSentAt)
  );
}

/** Whether the tenant must accept or decline a bond settlement proposal. */
export function needsVacatingSettlementAction(vacating: VacatingCase): boolean {
  return (
    vacating.status === 'open' &&
    vacating.currentStage === VACATING_STAGE.BOND &&
    vacating.tenantSettlementStatus === 'pending' &&
    vacating.refundAmount != null
  );
}

/** Active agent-opened end-leasing case awaiting tenant action, if any. */
export function findActiveEndLeasingCase(
  cases: VacatingCase[],
): VacatingCase | undefined {
  return cases.find((c) => c.status === 'open');
}

/** Highest-priority end-leasing action for dashboard urgency. */
export function findUrgentEndLeasingCase(
  cases: VacatingCase[],
): VacatingCase | undefined {
  return cases.find(needsVacatingResponsibilityReviewAction) ?? cases.find(needsVacatingRepairQuoteAction) ?? cases.find(needsVacatingSettlementAction) ?? findActiveEndLeasingCase(cases);
}
