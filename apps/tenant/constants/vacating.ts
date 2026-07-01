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
