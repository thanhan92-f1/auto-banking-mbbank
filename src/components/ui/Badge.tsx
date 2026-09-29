import React from 'react';

interface BadgeProps {
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  switch (status) {
    case 'PAID':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          Đã Thanh Toán
        </span>
      );
    case 'PENDING':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          Chờ Thanh Toán
        </span>
      );
    case 'EXPIRED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
          Hết Hạn
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {status}
        </span>
      );
  }
};
