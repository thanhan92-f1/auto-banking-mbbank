'use client';

import React from 'react';
import { Wallet, TrendingUp, ShieldCheck, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface BalanceCardProps {
  balance: number;
  accountNo: string;
  accountName: string;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  accountNo,
  accountName,
  isLoading = false,
  onRefresh,
}) => {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-950 text-white border-0 shadow-2xl shadow-blue-600/20">
      {/* Background Decorative Rings */}
      <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-blue-500/10 pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/15">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-blue-200 font-medium tracking-wide">TÀI KHOẢN THANH TOÁN</p>
              <h3 className="font-bold text-sm tracking-wider">MBBANK (Quân Đội)</h3>
            </div>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-50"
            title="Làm mới số dư"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Số dư */}
        <div className="space-y-1">
          <p className="text-xs text-blue-200">Số dư khả dụng</p>
          <div className="text-3xl sm:text-4xl font-black tracking-tight flex items-baseline gap-2">
            <span>{balance.toLocaleString('vi-VN')}</span>
            <span className="text-lg font-medium text-blue-300">VNĐ</span>
          </div>
        </div>

        {/* Footer info: STK & Chủ tài khoản */}
        <div className="pt-4 border-t border-white/15 flex justify-between items-end text-xs">
          <div>
            <p className="text-blue-300 text-[10px] uppercase font-semibold">Chủ tài khoản</p>
            <p className="font-bold tracking-wider text-sm mt-0.5">{accountName}</p>
          </div>
          <div className="text-right">
            <p className="text-blue-300 text-[10px] uppercase font-semibold">Số tài khoản</p>
            <p className="font-mono font-bold tracking-widest text-sm mt-0.5">{accountNo}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
