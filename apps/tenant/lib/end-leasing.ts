import { VACATING_STAGE } from '@/constants/vacating';
import type { VacatingCase } from '@/lib/types';

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
  return cases.find(needsVacatingRepairQuoteAction) ?? cases.find(needsVacatingSettlementAction) ?? findActiveEndLeasingCase(cases);
}
