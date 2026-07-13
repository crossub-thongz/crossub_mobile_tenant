import type { NewLeasingCase, OnboardingStep } from '@/lib/types';

/** Human label for an agent new-leasing lifecycle step. */
export const NEW_LEASING_STEP_LABEL: Record<NewLeasingCase['lifecycleStep'], string> = {
  open_inspection: 'Open inspection',
  open_report: 'Open report',
  application_approval: 'Application review',
  onboarding: 'Onboarding',
};

/** Whether the tenant still has onboarding checklist items to complete. */
export function needsNewLeasingOnboardingAction(
  leasingCase: NewLeasingCase,
  onboardingSteps: OnboardingStep[],
): boolean {
  if (!leasingCase.onboardingActive) return false;
  return onboardingSteps.some((s) => s.status !== 'completed');
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
): NewLeasingCase | undefined {
  return (
    cases.find((c) => needsNewLeasingOnboardingAction(c, onboardingSteps)) ??
    findActiveNewLeasingCase(cases)
  );
}
