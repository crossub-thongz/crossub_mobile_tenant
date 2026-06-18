import { NextResponse } from 'next/server';

import { verifyProvisionedAccount } from '@/lib/tenant-accounts-server';

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    if (!body.email?.trim() || !body.password) {
      return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
    }

    const account = await verifyProvisionedAccount(body.email, body.password);
    if (!account) {
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }

    return NextResponse.json({ user: account });
  } catch {
    return NextResponse.json({ message: 'Login failed.' }, { status: 500 });
  }
}
