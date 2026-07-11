'use server';

import type {
  GuestApplicationResult,
  SubmitGuestApplicationInput,
} from '@/lib/crossub-api/public-listings-client';

const apiBase = (): string =>
  process.env.API_INTERNAL_URL ?? 'http://localhost:3001';

/** Submit a guest rental application server-side (always POST to the API). */
export async function submitGuestApplicationAction(
  propertyId: string,
  body: SubmitGuestApplicationInput,
): Promise<GuestApplicationResult> {
  const upstream = await fetch(
    `${apiBase()}/api/v1/public/listings/${encodeURIComponent(propertyId)}/applications`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    },
  );

  if (!upstream.ok) {
    const err = (await upstream.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const raw = err?.message;
    const message = Array.isArray(raw) ? raw[0] : raw;
    throw new Error(message ?? 'Failed to submit application');
  }

  return upstream.json() as Promise<GuestApplicationResult>;
}
