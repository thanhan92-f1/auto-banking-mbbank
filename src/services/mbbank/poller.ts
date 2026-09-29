import { mbbankClient } from './client';
import { MBBankTransaction } from '@/types/bank';
import { ENV } from '@/config/env';

interface CachedTransactions {
  data: MBBankTransaction[];
  timestamp: number;
}

class AntiSpamPollerService {
  private cache: CachedTransactions | null = null;
  private inFlightPromise: Promise<MBBankTransaction[]> | null = null;
  private lastErrorTime: number = 0;
  private backoffUntil: number = 0;

  // Mock list cho mục đích demo / test khi chưa cấu hình tài khoản thật
  private mockTransactions: MBBankTransaction[] = [];

  /**
   * Lấy lịch sử giao dịch có bộ đệm chống spam (Shared Cache + In-flight deduplication)
   */
  public async getTransactionsAntiSpam(): Promise<MBBankTransaction[]> {
    const now = Date.now();

    // 1. Kiểm tra Cache còn hạn (TTL = 4s)
    if (this.cache && now - this.cache.timestamp < ENV.POLLER.SHARED_CACHE_TTL_MS) {
      return this.mergeWithMock(this.cache.data);
    }

    // 2. Nếu đang bị lỗi gần đây, áp dụng backoff 10s tránh làm nghẽn IP
    if (now < this.backoffUntil && this.cache) {
      console.warn('[AntiSpamPoller] Đang trong thời gian backoff, trả về cache cũ.');
      return this.mergeWithMock(this.cache.data);
    }

    // 3. Nếu đang có một request khác đang gọi lên MBBank, gom lại cùng chờ (Deduplication)
    if (this.inFlightPromise) {
      const data = await this.inFlightPromise;
      return this.mergeWithMock(data);
    }

    // 4. Bắt đầu gửi request lấy dữ liệu mới
    this.inFlightPromise = (async () => {
      try {
        // Nếu chưa cấu hình tài khoản, tự động dùng mock data để hệ thống không bị crash
        if (!ENV.MB.LOGIN_ID || !ENV.MB.PASSWORD) {
          return [];
        }

        const freshData = await mbbankClient.getTransactions();
        this.cache = {
          data: freshData,
          timestamp: Date.now(),
        };
        return freshData;
      } catch (err: any) {
        console.error('[AntiSpamPoller] Lỗi khi quét giao dịch:', err.message);
        this.lastErrorTime = Date.now();
        this.backoffUntil = Date.now() + 60000; // Backoff 60s để website phản hồi tức thì

        // Trả về cache cũ nếu có
        if (this.cache) return this.cache.data;
        return [];
      } finally {
        this.inFlightPromise = null;
      }
    })();

    const result = await this.inFlightPromise;
    return this.mergeWithMock(result);
  }

  /**
   * Cho phép thêm một giao dịch test mô phỏng để người dùng thử nghiệm quét mã thành công
   */
  public addMockTransaction(mock: { amount: number; content: string; accountNo?: string }) {
    const fakeTx: MBBankTransaction = {
      transactionId: `mock-${Date.now()}`,
      refNo: `MOCK${Date.now()}`,
      amount: mock.amount,
      type: 'IN',
      content: mock.content,
      transactionDate: new Date(),
      accountReceiver: mock.accountNo || ENV.MB.ACCOUNT_NO,
    };
    this.mockTransactions.unshift(fakeTx);
    console.log(`[AntiSpamPoller] Đã thêm giao dịch test mô phỏng: ${fakeTx.amount}đ | "${fakeTx.content}"`);
  }

  /**
   * Xóa toàn bộ các giao dịch test mô phỏng
   */
  public clearMockTransactions() {
    this.mockTransactions = [];
    console.log('[AntiSpamPoller] Đã xóa toàn bộ giao dịch test mô phỏng.');
  }

  private mergeWithMock(realData: MBBankTransaction[]): MBBankTransaction[] {
    return [...this.mockTransactions, ...realData];
  }
}

export const antiSpamPoller = new AntiSpamPollerService();
