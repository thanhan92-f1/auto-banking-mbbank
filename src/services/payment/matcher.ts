import { orderStore } from '@/stores/orderStore';
import { antiSpamPoller } from '@/services/mbbank/poller';
import { Order } from '@/types/order';

class PaymentMatcherService {
  /**
   * Kiểm tra đối soát 1 đơn hàng cụ thể
   */
  public async checkOrderStatus(orderId: string): Promise<Order | null> {
    const order = orderStore.getOrder(orderId);
    if (!order) return null;

    // Nếu đơn hàng đã hoàn tất hoặc bị hủy, trả về ngay không cần quét
    if (order.status === 'PAID' || order.status === 'CANCELLED') {
      return order;
    }

    // Kiểm tra hết hạn (ví dụ quá 15 phút)
    if (Date.now() > order.expiresAt) {
      orderStore.updateStatus(order.id, 'EXPIRED');
      return orderStore.getOrder(order.id) || null;
    }

    // Quét lịch sử giao dịch qua bộ đệm Anti-Spam
    const transactions = await antiSpamPoller.getTransactionsAntiSpam();

    // Tìm giao dịch khớp:
    // 1. Tiền vào (IN)
    // 2. Số tiền >= số tiền đơn hàng
    // 3. Nội dung chuyển khoản chứa mã chuyển khoản unique (không phân biệt hoa/thường)
    // 4. Thời gian giao dịch sau khi đơn được tạo (cho phép sai số 2 phút)
    const code = order.uniqueTransferCode.toLowerCase();
    const matchedTx = transactions.find((tx) => {
      if (tx.type !== 'IN') return false;
      if (tx.amount < order.amount) return false;

      const content = (tx.content || '').toLowerCase();
      const hasCode = content.includes(code);
      if (!hasCode) return false;

      const txTime = new Date(tx.transactionDate).getTime();
      const minValidTime = order.createdAt - 120000; // Trừ 2 phút sai lệch đồng hồ
      return txTime >= minValidTime;
    });

    if (matchedTx) {
      console.log(`[PaymentMatcher] 🎉 KHỚP ĐƠN HÀNG THÀNH CÔNG! Đơn: ${order.orderCode} | Tiền: ${matchedTx.amount}đ | GD: ${matchedTx.transactionId}`);
      orderStore.updateStatus(order.id, 'PAID', {
        matchedTransactionId: matchedTx.transactionId,
        paidAt: Date.now(),
      });
    }

    return orderStore.getOrder(order.id) || null;
  }
}

export const paymentMatcher = new PaymentMatcherService();
