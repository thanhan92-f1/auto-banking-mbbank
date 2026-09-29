'use client';

import { MBBankTransaction } from '@/types/bank';
import { ArrowDownLeft, ArrowUpRight, Inbox, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

interface TransactionTableProps {
  transactions: MBBankTransaction[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  isLoading = false,
  onRefresh,
}) => {
  const [clearing, setClearing] = useState(false);

  const mockTransactions = transactions.filter(
    (tx) => tx.transactionId.startsWith('mock-') || tx.refNo.startsWith('MOCK')
  );
  const hasMock = mockTransactions.length > 0;

  const handleClearMock = async () => {
    try {
      setClearing(true);
      await fetch('/api/bank/transactions/clear-mock', { method: 'POST' });
      if (onRefresh) {
        onRefresh();
      }
    } catch (e) {
      console.error('Lỗi khi xóa giao dịch mock:', e);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Lịch Sử Biến Động Số Dư</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dữ liệu sao kê thời gian thực từ MBBank
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Nút xóa các giao dịch mock mô phỏng */}
          {hasMock && (
            <button
              onClick={handleClearMock}
              disabled={clearing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer shadow-xs"
              title="Xóa toàn bộ các giao dịch test mô phỏng để bảng chỉ hiển thị sao kê MBBank thực tế"
            >
              <Trash2 className={`w-3.5 h-3.5 ${clearing ? 'animate-spin' : ''}`} />
              <span>{clearing ? 'Đang xóa...' : `Xóa ${mockTransactions.length} giao dịch test`}</span>
            </button>
          )}

          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
            {transactions.length} giao dịch
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3.5">Thời gian</th>
              <th className="px-5 py-3.5">Loại</th>
              <th className="px-5 py-3.5 text-right">Số tiền</th>
              <th className="px-5 py-3.5">Nội dung chi tiết</th>
              <th className="px-5 py-3.5 text-right">Mã GD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    <span>Đang nạp sao kê ngân hàng...</span>
                  </div>
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <span>Chưa có biến động số dư nào gần đây</span>
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
                const isIn = tx.type === 'IN';
                return (
                  <tr
                    key={tx.transactionId}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                      {new Date(tx.transactionDate).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                          isIn
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {isIn ? (
                          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        {isIn ? 'Tiền vào' : 'Tiền ra'}
                      </span>
                    </td>
                    <td
                      className={`px-5 py-4 whitespace-nowrap text-right font-bold text-sm ${
                        isIn
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {isIn ? '+' : '-'}
                      {tx.amount.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-700 dark:text-slate-300 max-w-xs truncate font-medium">
                      {tx.content}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right font-mono text-xs text-slate-400 dark:text-slate-500">
                      {tx.refNo}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
