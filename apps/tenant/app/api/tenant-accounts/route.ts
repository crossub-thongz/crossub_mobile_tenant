import { NextResponse } from 'next/server';

import {
  provisionTenantAccount,
  type TenantProvisionInput,
} from '@/lib/tenant-accounts-server';

const corsHeaders = (origin: string | null): HeadersInit => {
  const allowed =
    process.env.NEXT_PUBLIC_AGENT_PORTAL_URL ?? 'http://localhost:3002';
  const headers: HeadersInit = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (origin === allowed || origin?.startsWith('http://localhost:')) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
};

export async function OPTIONS(req: Request): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get('origin')),
  });
}

export async function POST(req: Request): Promise<NextResponse> {
  const headers = corsHeaders(req.headers.get('origin'));

  try {
    const body = (await req.json()) as TenantProvisionInput;
    const { email, password, firstName, lastName } = body;

    if (!email?.trim() || !password || !firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json(
        { message: 'Email, password, first name, and last name are required.' },
        { status: 400, headers },
      );
    }

    const account = await provisionTenantAccount(body);
    return NextResponse.json(account, { status: 201, headers });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Registration failed.';
    const status = message.includes('already exists') ? 409 : 500;
    return NextResponse.json({ message }, { status, headers });
  }
}
