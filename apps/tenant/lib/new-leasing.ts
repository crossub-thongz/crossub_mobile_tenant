import type { NewLeasingCase, OnboardingStep } from '@/lib/types';

/** Human label for an agent new-leasing lifecycle step. */
export const NEW_LEASING_STEP_LABEL: Record<NewLeasingCase['lifecycleStep'], string> = {
  open_inspection: 'Open inspection',
  open_report: 'Open report',
  application_approval: 'Application review',
  onboarding: 'Onboarding',
};

/** Whether every onboarding checklist step is finished. */
export function isOnboardingChecklistComplete(onboardingSteps: OnboardingStep[]): boolean {
  return onboardingSteps.length > 0 && onboardingSteps.every((s) => s.status === 'completed');
}

/** Whether the property-page move-in checklist banner should show. */
export function needsOnboardingChecklistAction(
  leasingOnboarding: { propertyId: string; onboardingComplete?: boolean } | null | undefined,
  onboardingSteps: OnboardingStep[],
  lease?: { propertyId?: string } | null,
): boolean {
  if (!leasingOnboarding || leasingOnboarding.onboardingComplete) return false;
  if (lease?.propertyId && lease.propertyId === leasingOnboarding.propertyId) return false;
  return onboardingSteps.some((s) => s.status !== 'completed');
}

/** Whether the tenant still has onboarding checklist items to complete. */
export function needsNewLeasingOnboardingAction(
  leasingCase: NewLeasingCase,
  onboardingSteps: OnboardingStep[],
): boolean {
  if (!leasingCase.onboardingActive) return false;
  return onboardingSteps.some((s) => s.status !== 'completed');
}

/** Whether a new-leasing card belongs in Action required / Property services. */
export function isNewLeasingActionRequired(
  leasingCase: NewLeasingCase,
  onboardingSteps: OnboardingStep[],
  leasedPropertyId?: string | null,
): boolean {
  if (leasedPropertyId && leasingCase.propertyId === leasedPropertyId) return false;
  if (needsNewLeasingOnboardingAction(leasingCase, onboardingSteps)) return true;
  if (leasingCase.lifecycleStep === 'onboarding') {
    return !isOnboardingChecklistComplete(onboardingSteps);
  }
  return (
    leasingCase.lifecycleStep === 'open_inspection' ||
    leasingCase.lifecycleStep === 'open_report' ||
    leasingCase.lifecycleStep === 'application_approval'
  );
}

/** First agent-opened new-leasing case, if any. */
export function findActiveNewLeasingCase(
  cases: NewLeasingCase[],
): NewLeasingCase | undefined {
  return cases[0];
}

/** Highest-priority new-leasing action for dashboard urgency. */
export function findUrgentNewLeasingCase(
  cases: NewLeasingCase[],
  onboardingSteps: OnboardingStep[],
  leasedPropertyId?: string | null,
): NewLeasingCase | undefined {
  return cases.find((c) =>
    isNewLeasingActionRequired(c, onboardingSteps, leasedPropertyId),
  );
}
