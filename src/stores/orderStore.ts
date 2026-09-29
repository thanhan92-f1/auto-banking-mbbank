import fs from 'fs';
import path from 'path';
import { Order, OrderStatus } from '@/types/order';

const ORDER_FILE = path.join(process.cwd(), '.orders_db.json');

class OrderStore {
  private orders: Map<string, Order> = new Map();

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(ORDER_FILE)) {
        const raw = fs.readFileSync(ORDER_FILE, 'utf-8');
        const list: Order[] = JSON.parse(raw);
        for (const order of list) {
          this.orders.set(order.id, order);
        }
      }
    } catch {}
  }

  private saveToDisk() {
    try {
      const list = Array.from(this.orders.values());
      fs.writeFileSync(ORDER_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch {}
  }

  public createOrder(order: Order): Order {
    this.orders.set(order.id, order);
    this.saveToDisk();
    return order;
  }

  public getOrder(id: string): Order | undefined {
    return this.orders.get(id);
  }

  public getPendingOrders(): Order[] {
    return Array.from(this.orders.values()).filter((o) => o.status === 'PENDING');
  }

  public getAllOrders(): Order[] {
    return Array.from(this.orders.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  public updateStatus(
    id: string,
    status: OrderStatus,
    extra?: { matchedTransactionId?: string; paidAt?: number }
  ): Order | undefined {
    const order = this.orders.get(id);
    if (!order) return undefined;

    order.status = status;
    if (extra?.matchedTransactionId) {
      order.matchedTransactionId = extra.matchedTransactionId;
    }
    if (extra?.paidAt) {
      order.paidAt = extra.paidAt;
    }

    this.orders.set(id, order);
    this.saveToDisk();
    return order;
  }

  /**
   * Gia hạn thêm 15 phút cho đơn hàng tính từ thời điểm hiện tại
   */
  public renewOrder(id: string, minutes: number = 15): Order | undefined {
    const order = this.orders.get(id);
    if (!order) return undefined;

    if (order.status !== 'PAID') {
      order.status = 'PENDING';
      order.expiresAt = Date.now() + minutes * 60 * 1000;
      this.orders.set(id, order);
      this.saveToDisk();
    }
    return order;
  }
}

export const orderStore = new OrderStore();
