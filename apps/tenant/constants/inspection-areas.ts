/** Shared default sections for rooms that use the standard condition checklist. */
export const COMMON_DEFAULT_SECTIONS = [
  'Walls / Picture Hooks',
  'Doors / Door Frames',
  'Windows / Screens / Window Safety Devices',
  'Ceiling / Light Fittings',
  'Blinds / Curtains',
  'Lights / Power Points',
  'Skirting Boards',
  'Floor Coverings',
] as const;

export type InspectionAreaDefinition = {
  name: string;
  defaultSections: readonly string[];
  optionalSections: readonly string[];
};

export const INSPECTION_AREA_CATALOG: readonly InspectionAreaDefinition[] = [
  {
    name: 'Entry',
    defaultSections: COMMON_DEFAULT_SECTIONS,
    optionalSections: ['Custom / Other'],
  },
  {
    name: 'Living Room',
    defaultSections: COMMON_DEFAULT_SECTIONS,
    optionalSections: ['Custom / Other'],
  },
  {
    name: 'Kitchen',
    defaultSections: COMMON_DEFAULT_SECTIONS,
    optionalSections: [
      'Cupboards / Drawers',
      'Bench Tops / Tiling',
      'Sink / Taps / Disposal Unit',
      'Stove Top / Hot Plates',
      'Oven / Grill',
      'Exhaust Fan / Hood',
      'Dishwasher',
      'Custom / Other',
    ],
  },
  {
    name: 'Laundry',
    defaultSections: COMMON_DEFAULT_SECTIONS,
    optionalSections: [
      'Cupboards / Drawers',
      'Bench Tops / Tiling',
      'Sink / Taps / Disposal Unit',
      'Washing Tub',
      'Washing Machine / Dryer',
      'Exhaust Fan / Vent',
      'Custom / Other',
    ],
  },
  {
    name: 'Bedroom',
    defaultSections: COMMON_DEFAULT_SECTIONS,
    optionalSections: ['Custom / Other'],
  },
  {
    name: 'Bathroom',
    defaultSections: COMMON_DEFAULT_SECTIONS,
    optionalSections: [
      'Wash Basin',
      'Mirror / Vanity',
      'Bath / Taps',
      'Shower / Taps',
      'Towel Rails',
      'Toilet & Toilet Roll Holder',
      'Heating / Vent / Exhaust',
      'Custom / Other',
    ],
  },
  {
    name: 'Balcony',
    defaultSections: COMMON_DEFAULT_SECTIONS,
    optionalSections: ['Balustrade / Railings', 'Custom / Other'],
  },
  {
    name: 'Garage',
    defaultSections: [],
    optionalSections: [
      'Garage Door & Remote Control',
      'Walls / Ceiling',
      'Floor / Concrete Slab',
      'Lights / Power Points',
      'Shelving / Storage Areas',
      'Custom / Other',
    ],
  },
  {
    name: 'Security',
    defaultSections: [],
    optionalSections: [
      'External Door Locks',
      'Window Locks',
      'Keys / Security Remotes / Fobs',
      'Security Cameras',
      'Security Alarms',
      'Smoke Alarms',
      'Electrical Safety Switches',
      'Custom / Other',
    ],
  },
  {
    name: 'General & Exterior',
    defaultSections: [],
    optionalSections: [
      'Heating / Air Conditioning',
      'Staircase / Handrails',
      'External Television Antenna / TV Points',
      'Lawn & Garden',
      'Garden Hose / Fittings / Watering System',
      'Gates & Fences / Pool Fence & Gate',
      'Letterbox / Street Number',
      'Water Tanks / Septic Tanks',
      'Garbage Bins',
      'Pavement / Driveway',
      'Clothes Line',
      'Garage / Carport / Storeroom',
      'Hot Water System',
      'Gutters / Downpipes',
      'Custom / Other',
    ],
  },
] as const;

export function sectionAreaName(area: string, section: string): string {
  return `${area} · ${section}`;
}

export function parseSectionAreaName(
  combined: string,
): { area: string; section: string } | null {
  const sep = ' · ';
  const idx = combined.indexOf(sep);
  if (idx <= 0) return null;
  return {
    area: combined.slice(0, idx).trim(),
    section: combined.slice(idx + sep.length).trim(),
  };
}
