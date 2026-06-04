import { type NextRequest, NextResponse } from 'next/server';

const apiBase = (): string => {
  const url = process.env.API_INTERNAL_URL?.trim();
  if (url) return url.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'API_INTERNAL_URL is not set. In Render, set it to your crossub_web API URL (e.g. https://your-api.onrender.com).',
    );
  }
  return 'http://localhost:3001';
};

const forwardHeaders = (req: NextRequest): Headers => {
  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('connection');
  return headers;
};

const buildUpstreamUrl = (req: NextRequest, path: string[]): string => {
  const suffix = path.length > 0 ? path.join('/') : '';
  return `${apiBase()}/api/${suffix}${req.nextUrl.search}`;
};

const rewriteSetCookie = (cookie: string): string =>
  cookie
    .split(';')
    .filter((part) => !part.trim().toLowerCase().startsWith('domain='))
    .join(';');

const proxy = async (
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> => {
  const { path } = await context.params;

  let upstreamUrl: string;
  try {
    upstreamUrl = buildUpstreamUrl(req, path);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'API proxy misconfigured';
    return NextResponse.json({ error: message }, { status: 503 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
    method: req.method,
    headers: forwardHeaders(req),
    body:
      req.method === 'GET' || req.method === 'HEAD'
        ? undefined
        : await req.arrayBuffer(),
    redirect: 'manual',
    });
  } catch {
    return NextResponse.json(
      {
        error:
          'Cannot reach crossub_web API. Check API_INTERNAL_URL on Render points to a running API service.',
      },
      { status: 502 },
    );
  }

  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
  });

  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === 'set-cookie') return;
    if (lower === 'transfer-encoding') return;
    response.headers.set(key, value);
  });

  const cookies = upstream.headers.getSetCookie?.() ?? [];
  for (const cookie of cookies) {
    response.headers.append('set-cookie', rewriteSetCookie(cookie));
  }

  return response;
};

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
