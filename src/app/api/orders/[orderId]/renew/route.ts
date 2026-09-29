import { NextResponse } from 'next/server';
import { orderStore } from '@/stores/orderStore';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const order = orderStore.renewOrder(orderId, 15);

    if (!order) {
      return NextResponse.json({ success: false, error: 'Đơn hàng không tồn tại' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order,
      message: 'Đã gia hạn đơn hàng thêm 15 phút',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
