import { NextResponse } from 'next/server';
import { orderStore } from '@/stores/orderStore';

export async function GET() {
  try {
    const orders = orderStore.getAllOrders();
    return NextResponse.json({
      success: true,
      orders,
      total: orders.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
