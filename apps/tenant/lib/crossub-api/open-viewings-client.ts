import { parseApiErrorMessage } from '@/lib/api-error-message';

const PUBLIC_API_V1 = '/api/v1';

export interface OpenViewingCheckInInput {
  name: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface OpenViewingCheckInResult {
  ok: true;
  attendeeId: string;
  viewingRequestId: string;
}

/** Public open-inspection check-in (`POST /api/v1/open-viewings/public/sessions/:id/register`). */
export async function submitOpenViewingCheckIn(
  sessionId: string,
  body: OpenViewingCheckInInput,
): Promise<OpenViewingCheckInResult> {
  const res = await fetch(
    `${PUBLIC_API_V1}/open-viewings/public/sessions/${encodeURIComponent(sessionId)}/register`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'omit',
      body: JSON.stringify(body),
    },
  );

  const payload: unknown = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    throw new Error(
      parseApiErrorMessage(payload, res.status, 'Failed to submit check-in'),
    );
  }

  return payload as OpenViewingCheckInResult;
}
