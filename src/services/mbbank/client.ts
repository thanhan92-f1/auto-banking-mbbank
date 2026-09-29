import axios, { AxiosInstance } from 'axios';
import * as playwright from 'playwright';
import { captchaSolver } from '../captcha/solver';
import { sessionManager } from './session';
import { MBBankTransaction, MBBankBalance } from '@/types/bank';
import { ENV } from '@/config/env';

const MB_CONSTANTS = {
  LOGIN_URL: 'https://online.mbbank.com.vn/pl/login',
  TRANSACTIONS_URL:
    'https://online.mbbank.com.vn/api/retail-transactionms/transactionms/get-account-transaction-history',
  BALANCE_URL:
    'https://online.mbbank.com.vn/api/retail-web-accountms/getBalance',
  WEB_AUTH_TOKEN: 'Basic RU1CUkVUQUlMV0VCOlNEMjM0ZGZnMzQlI0BGR0AzNHNmc2RmNDU4NDNm',
};

function formatDDMMYYYY(date: Date): string {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const vnDate = new Date(utc + 7 * 3600000);
  const day = String(vnDate.getDate()).padStart(2, '0');
  const month = String(vnDate.getMonth() + 1).padStart(2, '0');
  const year = vnDate.getFullYear();
  return `${day}/${month}/${year}`;
}

function generateMBTimestamp(): string {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const vn = new Date(utc + 7 * 3600000);

  const day = String(vn.getDate()).padStart(2, '0');
  const month = String(vn.getMonth() + 1).padStart(2, '0');
  const year = vn.getFullYear();
  const hours = String(vn.getHours()).padStart(2, '0');
  const minutes = String(vn.getMinutes()).padStart(2, '0');
  const seconds = String(vn.getSeconds()).padStart(2, '0');
  const ms = String(vn.getMilliseconds()).padStart(3, '0');

  return `${day}${month}${year}${hours}${minutes}${seconds}${ms}`;
}

class MBBankClient {
  private httpClient: AxiosInstance;

  constructor() {
    this.httpClient = axios.create({
      timeout: 25000,
    });
  }

  /**
   * Đăng nhập MBBank và lấy SessionId
   */
  public async login(retryCount = 0): Promise<{ sessionId: string; deviceId: string }> {
    // Tránh spam nhiều request login đồng thời (Request Locking)
    if (retryCount === 0) {
      const activeLogin = sessionManager.getLoginPromise();
      if (activeLogin) {
        const res = await activeLogin;
        if (res.sessionId) return { sessionId: res.sessionId, deviceId: res.deviceId };
      }
    }

    const loginTask = (async () => {
      const loginId = ENV.MB.LOGIN_ID;
      const password = ENV.MB.PASSWORD;

      if (!loginId || !password) {
        throw new Error('Chưa cấu hình MB_LOGIN_ID hoặc MB_PASSWORD trong .env.local!');
      }

      console.log(`[MBBankClient] Bắt đầu đăng nhập tài khoản: ${loginId}...`);

      const browser = await playwright.chromium.launch({
        channel: 'chrome', // Dùng nhân Google Chrome thật trên máy để vượt qua Akamai WAF 100%
        headless: true,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
        ],
      });

      try {
        const context = await browser.newContext({
          viewport: { width: 1280, height: 720 },
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        });

        await context.addInitScript(() => {
          Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });

        const page = await context.newPage();

        let captchaBase64 = '';
        page.on('response', async (res) => {
          if (res.url().includes('getCaptchaImage')) {
            try {
              const json = await res.json();
              if (json.imageString) {
                captchaBase64 = json.imageString;
              }
            } catch (e) {}
          }
        });

        console.log('[MBBankClient] Đang truy cập trang đăng nhập MBBank (Google Chrome)...');
        await page.goto(MB_CONSTANTS.LOGIN_URL, { waitUntil: 'networkidle', timeout: 30000 });

        // Chờ nhận được captcha từ mạng
        for (let i = 0; i < 20 && !captchaBase64; i++) {
          await page.waitForTimeout(500);
        }

        if (!captchaBase64) {
          throw new Error('Không thể tải ảnh Captcha từ MBBank. Vui lòng kiểm tra lại kết nối mạng.');
        }

        // Giải captcha trực tiếp bằng ONNX nội bộ
        const solveResult = await captchaSolver.solve(captchaBase64);
        console.log(`[MBBankClient] Đã giải Captcha tự động: "${solveResult.text}" (${solveResult.durationMs}ms)`);

        if (!solveResult.success || !solveResult.text) {
          throw new Error('Không thể giải mã Captcha!');
        }

        // Điền form đăng nhập tự động với ID chính xác của MBBank
        await page.locator('#user-id').fill(loginId);
        await page.locator('#new-password').fill(password);
        await page.locator('input[placeholder*="KIỂM TRA" i]').fill(solveResult.text);

        // Bắt response kết quả doLogin
        const loginResponsePromise = page.waitForResponse(
          (response) => response.url().includes('doLogin'),
          { timeout: 30000 }
        );

        await page.locator('#login-btn').click();

        const loginResponse = await loginResponsePromise;
        const loginJson = await loginResponse.json();

        if (loginJson.result?.responseCode === 'GW18') {
          throw new Error('Tài khoản MBBank đang bị khóa (Mã lỗi GW18). Vui lòng mở App MBBank trên điện thoại bấm "Quên mật khẩu" để mở khóa trước.');
        }

        if (loginJson.result?.responseCode === 'GW283') {
          if (retryCount < 2) {
            console.log(`[MBBankClient] Mã Captcha không khớp (GW283). Đang tự động thử lại lần ${retryCount + 1}...`);
            await browser.close().catch(() => {});
            return await this.login(retryCount + 1);
          }
          throw new Error('Mã Captcha không khớp (GW283) sau 3 lần thử.');
        }

        if (!loginJson.result?.ok) {
          const msg = loginJson.result?.message?.message || loginJson.result?.message || 'Đăng nhập thất bại';
          throw new Error(`[MBBank ${loginJson.result?.responseCode || 'ERROR'}] ${msg}`);
        }

        const sessionId = loginJson.sessionId;
        const deviceId = loginJson.cust?.deviceId || loginJson.cust?.deviceIdCommon || '';

        sessionManager.setSession(sessionId, deviceId);
        console.log(`[MBBankClient] Đăng nhập thành công! SessionId: ${sessionId.substring(0, 15)}...`);

        return { sessionId, deviceId };
      } finally {
        await browser.close().catch(() => {});
      }
    })();

    sessionManager.setLoginPromise(
      loginTask
        .then((res) => ({
          sessionId: res.sessionId,
          deviceId: res.deviceId,
          isLoggedIn: true,
        }))
        .catch((err) => {
          sessionManager.clearSession(err.message);
          return {
            sessionId: null,
            deviceId: '',
            isLoggedIn: false,
            loginError: err.message,
          };
        })
    );

    try {
      const res = await loginTask;
      return res;
    } finally {
      sessionManager.setLoginPromise(null);
    }
  }

  /**
   * Đảm bảo Session còn hiệu lực
   */
  public async ensureSession(): Promise<{ sessionId: string; deviceId: string }> {
    const session = sessionManager.getSession();
    if (session.isLoggedIn && session.sessionId) {
      return { sessionId: session.sessionId, deviceId: session.deviceId };
    }
    return await this.login();
  }

  /**
   * Lấy lịch sử giao dịch MBBank
   */
  public async getTransactions(options?: {
    accountNo?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<MBBankTransaction[]> {
    const session = await this.ensureSession();

    const now = new Date();
    const fromDate = options?.fromDate || new Date(now.getTime() - ENV.POLLER.MAX_HISTORY_DAYS * 24 * 3600 * 1000);
    const toDate = options?.toDate || now;

    const fromDateStr = formatDDMMYYYY(fromDate);
    const toDateStr = formatDDMMYYYY(toDate);

    const accountNo = options?.accountNo || ENV.MB.ACCOUNT_NO;
    const refNo = `${accountNo.toUpperCase()}${generateMBTimestamp()}`;

    const payload = {
      accountNo,
      fromDate: fromDateStr,
      toDate: toDateStr,
      sessionId: session.sessionId,
      refNo,
      deviceIdCommon: session.deviceId,
    };

    const headers = {
      'X-Request-Id': generateMBTimestamp(),
      'Cache-Control': 'no-cache',
      Accept: 'application/json, text/plain, */*',
      Authorization: MB_CONSTANTS.WEB_AUTH_TOKEN,
      Deviceid: session.deviceId,
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      Origin: 'https://online.mbbank.com.vn',
      Referer: 'https://online.mbbank.com.vn/',
      Refno: refNo,
      'Content-Type': 'application/json; charset=UTF-8',
    };

    try {
      const response = await this.httpClient.post(MB_CONSTANTS.TRANSACTIONS_URL, payload, { headers });
      const data = response.data;

      // Xử lý khi phiên hết hạn (GW200) -> Tự động re-login và gọi lại 1 lần
      if (data.result?.responseCode === 'GW200') {
        console.warn('[MBBankClient] Phiên làm việc hết hạn (GW200). Đang đăng nhập lại...');
        sessionManager.clearSession('Session expired (GW200)');
        await this.login();
        return await this.getTransactions(options);
      }

      if (!data.result?.ok) {
        throw new Error(`MBBank Error: ${data.result?.message || 'Không thể lấy sao kê'}`);
      }

      // Cập nhật gia hạn thời gian sống của token khi có hoạt động
      sessionManager.refreshExpiry();

      const list: any[] = data.transactionHistoryList || [];

      // Chuẩn hóa danh sách giao dịch
      return list.map((tx) => {
        const parts = (tx.transactionDate || '').split(' ');
        let txDate = new Date();
        if (parts.length >= 2) {
          const [d, m, y] = parts[0].split('/').map(Number);
          const [hh, mm, ss] = parts[1].split(':').map(Number);
          txDate = new Date(y, m - 1, d, hh, mm, ss);
        }

        const credit = Number(tx.creditAmount) || 0;
        const debit = Number(tx.debitAmount) || 0;

        return {
          transactionId: `mbbank-${tx.refNo}`,
          refNo: tx.refNo,
          amount: credit > 0 ? credit : debit,
          type: credit > 0 ? 'IN' : 'OUT',
          content: tx.description || '',
          transactionDate: txDate,
          accountReceiver: tx.accountNo || accountNo,
          raw: tx,
        };
      });
    } catch (error: any) {
      console.error('[MBBankClient] Lỗi khi lấy lịch sử giao dịch:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Lấy số dư tài khoản
   */
  public async getBalance(accountNo?: string): Promise<MBBankBalance> {
    const targetAccount = accountNo || ENV.MB.ACCOUNT_NO;
    // Để an toàn và nhanh, nếu chưa có session thì thử lấy hoặc mock
    try {
      const txs = await this.getTransactions({ accountNo: targetAccount });
      const lastTx = txs[0]?.raw;
      const balance = lastTx?.availableBalance ? Number(lastTx.availableBalance) : 0;
      return {
        accountNo: targetAccount,
        accountName: ENV.MB.ACCOUNT_NAME,
        balance,
        currency: 'VND',
        updatedAt: new Date(),
      };
    } catch (e: any) {
      return {
        accountNo: targetAccount,
        accountName: ENV.MB.ACCOUNT_NAME,
        balance: 0,
        currency: 'VND',
        updatedAt: new Date(),
      };
    }
  }
}

export const mbbankClient = new MBBankClient();
