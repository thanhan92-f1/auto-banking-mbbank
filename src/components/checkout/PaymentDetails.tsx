'use client';

import React, { useState } from 'react';
import { Copy, Check, AlertCircle, Building2, User, CreditCard, Hash, Coins } from 'lucide-react';
import { Order } from '@/types/order';

interface PaymentDetailsProps {
  order: Order;
}

export const PaymentDetails: React.FC<PaymentDetailsProps> = ({ order }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Alert cảnh báo nội dung chuyển khoản */}
      <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          <span className="font-bold">Lưu ý quan trọng:</span> Quý khách vui lòng nhập chính xác{' '}
          <span className="font-bold underline text-amber-900 dark:text-amber-200">
            Nội dung chuyển khoản
          </span>{' '}
          bên dưới để hệ thống tự động xác nhận đơn hàng trong 3 giây.
        </div>
      </div>

      {/* Danh sách các trường thông tin */}
      <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl divide-y divide-slate-200/60 dark:divide-slate-800 text-sm">
        {/* Ngân hàng */}
        <div className="flex items-center justify-between p-3.5">
          <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
            <Building2 className="w-4 h-4 text-blue-500" />
            <span>Ngân hàng</span>
          </div>
          <span className="font-semibold text-slate-900 dark:text-slate-100">{order.bankName}</span>
        </div>

        {/* Chủ tài khoản */}
        <div className="flex items-center justify-between p-3.5">
          <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
            <User className="w-4 h-4 text-indigo-500" />
            <span>Chủ tài khoản</span>
          </div>
          <span className="font-semibold text-slate-900 dark:text-slate-100 tracking-wide">
            {order.bankAccountName}
          </span>
        </div>

        {/* Số tài khoản */}
        <div className="flex items-center justify-between p-3.5">
          <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
            <CreditCard className="w-4 h-4 text-emerald-500" />
            <span>Số tài khoản</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-base">
              {order.bankAccountNo}
            </span>
            <button
              onClick={() => handleCopy(order.bankAccountNo, 'stk')}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors"
              title="Sao chép số tài khoản"
            >
              {copiedField === 'stk' ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Số tiền */}
        <div className="flex items-center justify-between p-3.5">
          <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
            <Coins className="w-4 h-4 text-amber-500" />
            <span>Số tiền</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
              {order.amount.toLocaleString('vi-VN')} đ
            </span>
            <button
              onClick={() => handleCopy(String(order.amount), 'amount')}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors"
              title="Sao chép số tiền"
            >
              {copiedField === 'amount' ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Nội dung chuyển khoản - HIGHLIGHT */}
        <div className="flex items-center justify-between p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-b-xl border-t border-blue-100 dark:border-blue-900/50">
          <div className="flex items-center gap-2.5 text-blue-700 dark:text-blue-300 font-medium">
            <Hash className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Nội dung CK</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 text-base tracking-wider">
              {order.uniqueTransferCode}
            </span>
            <button
              onClick={() => handleCopy(order.uniqueTransferCode, 'content')}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              {copiedField === 'content' ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Đã chép
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Sao chép
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
