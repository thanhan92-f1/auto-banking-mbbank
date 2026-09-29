'use client';

import { Button } from '@/components/ui/Button';
import { Order } from '@/types/order';
import { announcePaymentSuccess } from '@/utils/speaker';
import confetti from 'canvas-confetti';
import { ArrowRight, CheckCircle2, Home, Volume2 } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

interface SuccessStateProps {
  order: Order;
}

export const SuccessState: React.FC<SuccessStateProps> = ({ order }) => {
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  const handleSpeak = async () => {
    setIsPlayingVoice(true);
    await announcePaymentSuccess(order.amount, order.description);
    setIsPlayingVoice(false);
  };

  useEffect(() => {
    // Tự động phát chuông Ting Ting và đọc to số tiền + mô tả đơn hàng
    handleSpeak();

    // Kích hoạt hiệu ứng pháo hoa confetti chúc mừng
    const end = Date.now() + 2.5 * 1000;
    const colors = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  return (
    <div className="flex flex-col items-center text-center p-4 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {/* Icon thành công với vòng sáng */}
      <div className="relative">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xl shadow-emerald-500/20 border-2 border-emerald-400/40 animate-bounce">
          <CheckCircle2 className="w-12 h-12" />
        </div>
      </div>

      <div className="space-y-2 flex flex-col items-center">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Thanh Toán Thành Công!
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
          Hệ thống ngân hàng MBBank đã ghi nhận khoản thanh toán cho đơn hàng{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-200">#{order.orderCode}</span>.
        </p>

        {/* Nút nghe lại giọng đọc thông báo */}
        <button
          type="button"
          onClick={handleSpeak}
          disabled={isPlayingVoice}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all cursor-pointer shadow-sm mt-1"
        >
          <Volume2 className={`w-3.5 h-3.5 ${isPlayingVoice ? 'animate-bounce text-emerald-500' : ''}`} />
          <span>{isPlayingVoice ? 'Đang đọc thông báo...' : '🔊 Nghe lại giọng đọc'}</span>
        </button>
      </div>

      {/* Thẻ chi tiết hóa đơn xác nhận */}
      <div className="w-full max-w-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 space-y-3.5 text-sm text-left">
        <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
          <span className="text-slate-500 dark:text-slate-400 text-xs">Số tiền thanh toán</span>
          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
            {order.amount.toLocaleString('vi-VN')} đ
          </span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">Mã đơn hàng</span>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{order.orderCode}</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">Cổng thanh toán</span>
          <span className="font-semibold text-blue-600 dark:text-blue-400">MBBank VietQR NAPAS 247</span>
        </div>

        {order.matchedTransactionId && (
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Mã giao dịch MB</span>
            <span className="font-mono text-slate-600 dark:text-slate-300 truncate max-w-[180px]">
              {order.matchedTransactionId}
            </span>
          </div>
        )}

        <div className="flex justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">Thời gian nhận</span>
          <span className="text-slate-600 dark:text-slate-300">
            {order.paidAt ? new Date(order.paidAt).toLocaleTimeString('vi-VN') : 'Vừa xong'}
          </span>
        </div>
      </div>

      {/* Nút hành động */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm pt-2">
        <Link href="/" className="flex-1">
          <Button variant="primary" className="w-full">
            <Home className="w-4 h-4 mr-2" />
            Tạo đơn mới
          </Button>
        </Link>
        <Link href="/dashboard" className="flex-1">
          <Button variant="outline" className="w-full">
            Vào Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
