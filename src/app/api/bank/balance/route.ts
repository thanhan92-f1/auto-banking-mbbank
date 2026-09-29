import { NextResponse } from 'next/server';
import { mbbankClient } from '@/services/mbbank/client';
import { sessionManager } from '@/services/mbbank/session';
import { ENV } from '@/config/env';

export async function GET() {
  try {
    const session = sessionManager.getSession();
    const balance = await mbbankClient.getBalance();

    return NextResponse.json({
      success: true,
      data: {
        ...balance,
        session,
        isConfigured: Boolean(ENV.MB.LOGIN_ID && ENV.MB.PASSWORD),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
