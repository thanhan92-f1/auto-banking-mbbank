import { NextResponse } from 'next/server';
import { antiSpamPoller } from '@/services/mbbank/poller';

export async function GET() {
  try {
    const transactions = await antiSpamPoller.getTransactionsAntiSpam();
    return NextResponse.json({
      success: true,
      transactions,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
