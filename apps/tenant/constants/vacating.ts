/** End-leasing phases — mirrors crossub_web `TERMINATION_STAGE`. */
export const VACATING_STAGE = {
  KEY_RETURN: 'key_return',
  OUTGOING_INSPECTION: 'outgoing_inspection',
  MAINTENANCE: 'maintenance',
  BOND: 'bond',
} as const;

export type VacatingStage = (typeof VACATING_STAGE)[keyof typeof VACATING_STAGE];

export const VACATING_STAGE_ORDER: VacatingStage[] = [
  VACATING_STAGE.KEY_RETURN,
  VACATING_STAGE.OUTGOING_INSPECTION,
  VACATING_STAGE.MAINTENANCE,
  VACATING_STAGE.BOND,
];

export const VACATING_STAGE_LABEL: Record<VacatingStage, string> = {
  [VACATING_STAGE.KEY_RETURN]: 'Key return',
  [VACATING_STAGE.OUTGOING_INSPECTION]: 'Outgoing inspection',
  [VACATING_STAGE.MAINTENANCE]: 'Maintenance',
  [VACATING_STAGE.BOND]: 'Bond & settlement',
};

export const VACATING_STAGE_SHORT: Record<VacatingStage, string> = {
  [VACATING_STAGE.KEY_RETURN]: 'Keys',
  [VACATING_STAGE.OUTGOING_INSPECTION]: 'Inspection',
  [VACATING_STAGE.MAINTENANCE]: 'Make-good',
  [VACATING_STAGE.BOND]: 'Bond',
};

/**
 * End-of-lease cleaning — the tenant says how it will be arranged (Daniel Zhou, 27 Sep 2026).
 * Values are the API's `cleaningArrangement`; the two choices are what the tenant may pick.
 */
export const VACATING_CLEANING = {
  PENDING: 'pending',
  OWN_ARRANGEMENT: 'own_arrangement',
  BOOKED: 'booked',
  DECLINED: 'declined',
} as const;

export type VacatingCleaning = (typeof VACATING_CLEANING)[keyof typeof VACATING_CLEANING];

export type VacatingCleaningChoice = typeof VACATING_CLEANING.OWN_ARRANGEMENT | typeof VACATING_CLEANING.BOOKED;

export const VACATING_CLEANING_CHOICES: VacatingCleaningChoice[] = [
  VACATING_CLEANING.OWN_ARRANGEMENT,
  VACATING_CLEANING.BOOKED,
];

export const VACATING_CLEANING_CHOICE_LABEL: Record<VacatingCleaningChoice, string> = {
  [VACATING_CLEANING.OWN_ARRANGEMENT]: "I'll arrange it myself",
  [VACATING_CLEANING.BOOKED]: 'Book Brightness AU',
};

export const VACATING_CLEANING_CHOICE_HINT: Record<VacatingCleaningChoice, string> = {
  [VACATING_CLEANING.OWN_ARRANGEMENT]: 'You book and pay your own end-of-lease cleaner.',
  [VACATING_CLEANING.BOOKED]: "CROSSUB's cleaning partner — your property manager will confirm the booking.",
};

export const VACATING_CLEANING_CHOSEN_BY = {
  TENANT: 'tenant',
  AGENT: 'agent',
} as const;

export type VacatingCleaningChosenBy =
  (typeof VACATING_CLEANING_CHOSEN_BY)[keyof typeof VACATING_CLEANING_CHOSEN_BY];
