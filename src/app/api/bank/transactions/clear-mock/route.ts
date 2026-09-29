import { NextResponse } from 'next/server';
import { antiSpamPoller } from '@/services/mbbank/poller';

export async function POST() {
  try {
    antiSpamPoller.clearMockTransactions();
    return NextResponse.json({
      success: true,
      message: 'Đã xóa toàn bộ giao dịch test mô phỏng thành công',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
