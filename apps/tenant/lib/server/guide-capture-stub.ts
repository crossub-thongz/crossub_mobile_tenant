/**
 * TEMPORARY — screenshot capture harness for the tenant routine-inspection guide.
 *
 * Enabled only when `GUIDE_CAPTURE=1`. Short-circuits the BFF proxy with canned
 * responses so the real routine self-inspection screens can be driven end to end
 * without a live API, a real tenancy, or any real tenant's personal data.
 *
 * Delete this file and its hook in `app/api/[...path]/route.ts` once the guide
 * screenshots are captured.
 */
import { NextResponse } from 'next/server';

export const GUIDE_CAPTURE_ENABLED = process.env.GUIDE_CAPTURE === '1';

const INSPECTION_ID = 'guide-routine-0001';
const SCHEDULE_ID = 'guide-schedule-0001';
const PROPERTY_ADDRESS = '12 Harbour Street, Sydney NSW 2000';

/** Ingoing-report areas the routine checklist is built from (`Area · Section`). */
const REFERENCE_INGOING_AREAS = [
  { name: 'Living Room · Walls / Picture Hooks', photos: [] as string[] },
  { name: 'Living Room · Floor Coverings', photos: [] as string[] },
  { name: 'Kitchen · Sink / Taps / Disposal Unit', photos: [] as string[] },
  { name: 'Kitchen · Oven / Grill', photos: [] as string[] },
  { name: 'Bathroom · Shower / Taps', photos: [] as string[] },
  { name: 'Bathroom · Toilet & Toilet Roll Holder', photos: [] as string[] },
];

/** Survives across requests in the dev server so submit flips the screen state. */
const state = { submitted: false };

const inspection = () => ({
  id: INSPECTION_ID,
  inspectionId: INSPECTION_ID,
  scheduleId: SCHEDULE_ID,
  propertyAddress: PROPERTY_ADDRESS,
  flow: 'self',
  status: state.submitted ? 'under_review' : 'awaiting_tenant',
  tenantActionRequired: !state.submitted,
  scheduledAt: '2026-08-20T00:00:00.000Z',
  submissionDeadline: '2026-08-27T00:00:00.000Z',
  declineReason: null,
  previousSubmission: null,
  reportUrl: null,
  sections: [],
  referenceIngoingAreas: REFERENCE_INGOING_AREAS,
});

const tenancy = {
  id: 'guide-tenancy-0001',
  propertyId: 'guide-property-0001',
  propertyAddress: PROPERTY_ADDRESS,
  propertySuburb: null,
  status: 'ACTIVE',
  startDate: '2025-09-01T00:00:00.000Z',
  endDate: '2027-08-31T00:00:00.000Z',
  weeklyRent: 720,
  leaseTerm: '24 months',
  contractType: 'Fixed',
  paymentCycle: 'WEEKLY',
  routineInspectionFrequency: 2,
  routineInspectionFrequencyMonths: 6,
  nextRoutineInspectionAt: '2026-08-20T00:00:00.000Z',
};

const user = {
  id: 'guide-tenant-0001',
  email: 'alex.tenant@example.com',
  role: 'TENANT',
  status: 'ACTIVE',
  profileCompleted: true,
  firstName: 'Alex',
  lastName: 'Tenant',
  phone: '+61 400 000 000',
  systemAccessAgreementRequired: false,
  systemAccessAccepted: true,
};

/**
 * Canned response for a proxied path, or null to let the real proxy run.
 * `path` is the catch-all segment array (e.g. ['v1','tenant','routine-inspections']).
 */
export async function guideCaptureResponse(
  method: string,
  path: string[],
  body: ArrayBuffer | undefined,
): Promise<NextResponse | null> {
  const route = path.join('/');

  if (route === 'auth/me') {
    return NextResponse.json({ user });
  }

  if (route === 'v1/tenant/tenancies') {
    return NextResponse.json({ items: [tenancy], hasMore: false, page: 1, pageSize: 20, total: 1 });
  }

  if (route === 'v1/tenant/routine-inspections') {
    return NextResponse.json([inspection()]);
  }

  if (route === `v1/tenant/routine-inspections/${INSPECTION_ID}`) {
    return NextResponse.json(inspection());
  }

  if (
    method === 'POST' &&
    route === `v1/tenant/routine-inspections/${SCHEDULE_ID}/start-self`
  ) {
    return NextResponse.json(inspection());
  }

  if (
    method === 'POST' &&
    route === `v1/tenant/routine-inspections/${SCHEDULE_ID}/submit-self`
  ) {
    state.submitted = true;
    return NextResponse.json(inspection());
  }

  // Echo the uploaded image straight back as a data URL so the thumbnail renders.
  if (method === 'POST' && route === 'v1/tenant/maintenance-requests/photos/upload') {
    let url = '';
    try {
      const parsed = JSON.parse(new TextDecoder().decode(body)) as {
        mimeType?: string;
        contentBase64?: string;
      };
      url = `data:${parsed.mimeType ?? 'image/jpeg'};base64,${parsed.contentBase64 ?? ''}`;
    } catch {
      url = '';
    }
    return NextResponse.json({ url });
  }

  // Everything else: 404 so TenantDataProvider's allSettled fan-out degrades that
  // slice only, exactly as it would against a partially-available API.
  return NextResponse.json({ message: 'Not available in guide capture mode' }, { status: 404 });
}

export const GUIDE_CAPTURE_SCHEDULE_ID = SCHEDULE_ID;
export const GUIDE_CAPTURE_INSPECTION_ID = INSPECTION_ID;
