import fs from 'fs';
import path from 'path';
import { MBBankSessionState } from '@/types/bank';

const SESSION_CACHE_FILE = path.join(process.cwd(), '.mbbank_session.json');

class SessionManager {
  private state: MBBankSessionState = {
    sessionId: null,
    deviceId: '',
    isLoggedIn: false,
  };

  private loginInProgressPromise: Promise<MBBankSessionState> | null = null;

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      // Ưu tiên nạp từ biến môi trường nếu có
      if (process.env.MB_SESSION_ID) {
        this.state = {
          sessionId: process.env.MB_SESSION_ID,
          deviceId: process.env.MB_DEVICE_ID || 'web-browser-device',
          lastLoginAt: new Date(),
          isLoggedIn: true,
        };
        console.log(`[SessionManager] Đã nạp MB_SESSION_ID từ .env.local: ${this.state.sessionId?.substring(0, 15)}...`);
        return;
      }

      if (fs.existsSync(SESSION_CACHE_FILE)) {
        const raw = fs.readFileSync(SESSION_CACHE_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (data.sessionId) {
          const lastLogin = data.lastLoginAt ? new Date(data.lastLoginAt) : new Date();
          this.state = {
            sessionId: data.sessionId,
            deviceId: data.deviceId || '',
            lastLoginAt: lastLogin,
            expiresAt: new Date(lastLogin.getTime() + 15 * 60 * 1000),
            isLoggedIn: true,
          };
          console.log(`[SessionManager] Đã nạp Session MBBank đã lưu: ${this.state.sessionId?.substring(0, 15)}...`);
        }
      }
    } catch (e) {
      // Bỏ qua nếu lỗi đọc file
    }
  }

  private saveToDisk() {
    try {
      fs.writeFileSync(
        SESSION_CACHE_FILE,
        JSON.stringify(
          {
            sessionId: this.state.sessionId,
            deviceId: this.state.deviceId,
            lastLoginAt: this.state.lastLoginAt?.toISOString(),
          },
          null,
          2
        ),
        'utf-8'
      );
    } catch (e) {
      console.warn('[SessionManager] Không thể lưu session vào disk:', e);
    }
  }

  public getSession(): MBBankSessionState {
    return { ...this.state };
  }

  public setSession(sessionId: string, deviceId: string) {
    const now = new Date();
    this.state = {
      sessionId,
      deviceId,
      lastLoginAt: now,
      expiresAt: new Date(now.getTime() + 15 * 60 * 1000), // MBBank session mặc định 15 phút
      isLoggedIn: true,
      loginError: undefined,
    };
    this.saveToDisk();
  }

  /**
   * Gia hạn thời điểm hết hạn ước tính mỗi khi có tương tác API thành công
   */
  public refreshExpiry() {
    if (this.state.isLoggedIn) {
      this.state.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    }
  }

  public clearSession(error?: string) {
    this.state = {
      sessionId: null,
      deviceId: this.state.deviceId || '',
      isLoggedIn: false,
      loginError: error,
    };
    try {
      if (fs.existsSync(SESSION_CACHE_FILE)) {
        fs.unlinkSync(SESSION_CACHE_FILE);
      }
    } catch {}
  }

  public getLoginPromise(): Promise<MBBankSessionState> | null {
    return this.loginInProgressPromise;
  }

  public setLoginPromise(promise: Promise<MBBankSessionState> | null) {
    this.loginInProgressPromise = promise;
  }
}

export const sessionManager = new SessionManager();
