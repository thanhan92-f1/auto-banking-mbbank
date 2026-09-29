import { NextResponse } from 'next/server';
import { orderStore } from '@/stores/orderStore';
import { antiSpamPoller } from '@/services/mbbank/poller';

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();
    const order = orderStore.getOrder(orderId);

    if (!order) {
      return NextResponse.json({ success: false, error: 'Đơn hàng không tồn tại' }, { status: 404 });
    }

    // Thêm giao dịch mô phỏng vào AntiSpamPoller
    antiSpamPoller.addMockTransaction({
      amount: order.amount,
      content: `Chuyen tien thanh toan ${order.uniqueTransferCode}`,
      accountNo: order.bankAccountNo,
    });

    return NextResponse.json({
      success: true,
      message: `Đã kích hoạt thanh toán mô phỏng cho đơn ${order.orderCode}! Polling sẽ tự động nhận diện trong vài giây.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
