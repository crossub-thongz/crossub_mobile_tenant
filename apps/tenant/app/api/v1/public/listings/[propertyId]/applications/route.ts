import { type NextRequest, NextResponse } from 'next/server';

const apiBase = (): string =>
  process.env.API_INTERNAL_URL ?? 'http://localhost:3001';

/** Explicit POST proxy for guest applications (avoids misconfigured client API bases). */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ propertyId: string }> },
): Promise<NextResponse> {
  const { propertyId } = await context.params;
  const upstream = await fetch(
    `${apiBase()}/api/v1/public/listings/${encodeURIComponent(propertyId)}/applications`,
    {
      method: 'POST',
      headers: {
        'Content-Type': req.headers.get('content-type') ?? 'application/json',
        Accept: 'application/json',
      },
      body: await req.arrayBuffer(),
    },
  );

  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
  });

  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === 'transfer-encoding' || lower === 'content-encoding' || lower === 'content-length') {
      return;
    }
    response.headers.set(key, value);
  });

  return response;
}

/** Browsers opening the API URL directly should land on the apply form. */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ propertyId: string }> },
): Promise<NextResponse> {
  const { propertyId } = await context.params;
  const sessionId = req.nextUrl.searchParams.get('sessionId');
  const applyPath = `/properties/${encodeURIComponent(propertyId)}/apply${
    sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''
  }`;
  return NextResponse.redirect(new URL(applyPath, req.url), 307);
}
