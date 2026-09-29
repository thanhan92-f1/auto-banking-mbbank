import { NextResponse } from 'next/server';
import { orderStore } from '@/stores/orderStore';
import { generateVietQR, generateUniqueTransferCode } from '@/services/vietqr/generator';
import { Order } from '@/types/order';
import { ENV } from '@/config/env';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const amount = Number(body.amount) || 50000;
    const description = body.description || 'Thanh toán đơn hàng';

    const timestamp = Date.now();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `order_${timestamp}_${randomSuffix}`;
    const orderCode = `DH${randomSuffix}`;
    const uniqueTransferCode = generateUniqueTransferCode('MBB');

    // Sinh mã VietQR
    const vietqr = generateVietQR({
      accountNo: ENV.MB.ACCOUNT_NO,
      accountName: ENV.MB.ACCOUNT_NAME,
      amount,
      content: uniqueTransferCode,
      template: 'compact2',
    });

    const newOrder: Order = {
      id: orderId,
      orderCode,
      uniqueTransferCode,
      amount,
      description,
      status: 'PENDING',
      qrUrl: vietqr.qrImageUrl,
      qrRaw: vietqr.content,
      bankAccountNo: vietqr.accountNo,
      bankAccountName: vietqr.accountName,
      bankName: vietqr.bankName,
      createdAt: timestamp,
      expiresAt: timestamp + ENV.ORDER.DEFAULT_EXPIRY_MINUTES * 60 * 1000,
    };

    orderStore.createOrder(newOrder);

    return NextResponse.json({
      success: true,
      order: newOrder,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
