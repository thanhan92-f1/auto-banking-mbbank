'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, KeyRound, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface SessionStatusProps {
  isLoggedIn: boolean;
  isConfigured: boolean;
  lastLoginAt?: string;
  expiresAt?: string;
  deviceId?: string;
  error?: string;
}

export const SessionStatus: React.FC<SessionStatusProps> = ({
  isLoggedIn,
  isConfigured,
  lastLoginAt,
  expiresAt,
  deviceId,
  error,
}) => {
  return (
    <Card className="flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Trạng Thái Phiên MBBank
          </h4>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              isLoggedIn
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLoggedIn ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            {isLoggedIn ? 'Đã Kết Nối' : 'Chưa Đăng Nhập'}
          </span>
        </div>

        <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span>Cấu hình tài khoản:</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {isConfigured ? '✅ Đã thiết lập (.env.local)' : '⚠️ Chưa thiết lập (Demo Mode)'}
            </span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span>Thiết bị (Device ID):</span>
            <span className="font-mono text-slate-900 dark:text-slate-100 truncate max-w-[160px]">
              {deviceId || 'Tự động cấp phát'}
            </span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span>Đăng nhập gần nhất:</span>
            <span className="text-slate-900 dark:text-slate-100">
              {lastLoginAt ? new Date(lastLoginAt).toLocaleTimeString('vi-VN') : 'Chưa có'}
            </span>
          </div>

          <div className="flex justify-between py-1.5">
            <span>Hết hạn Token (Ước tính):</span>
            <span className="font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {expiresAt
                ? `~${new Date(expiresAt).toLocaleTimeString('vi-VN')} (Tự gia hạn)`
                : '15 phút sau khi không dùng'}
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-400 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="mt-4 p-2.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl text-[11px] text-blue-700 dark:text-blue-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
        <span>Captcha được giải tự động bằng ONNX nội bộ trong ~10ms khi phiên hết hạn.</span>
      </div>
    </Card>
  );
};
