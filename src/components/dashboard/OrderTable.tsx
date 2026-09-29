'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Search,
  Inbox,
  Zap,
  ShoppingBag,
  Copy,
  Check,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types/order';
import Link from 'next/link';

interface OrderTableProps {
  orders: Order[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  isLoading = false,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleMockPay = async (orderId: string) => {
    try {
      setPayingOrderId(orderId);
      const res = await fetch('/api/orders/mock-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.success && onRefresh) {
        onRefresh();
      }
    } catch {
      // Bỏ qua lỗi
    } finally {
      setPayingOrderId(null);
    }
  };

  const handleOpenCheckout = async (order: Order) => {
    // Nếu đơn chưa hoàn tất, tự động set lại 15 phút tính từ thời điểm hiện tại
    if (order.status !== 'PAID') {
      try {
        await fetch(`/api/orders/${order.id}/renew`, { method: 'POST' });
        if (onRefresh) {
          onRefresh();
        }
      } catch (e) {}
    }
    window.open(`/checkout/${order.id}`, '_blank');
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.uniqueTransferCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.description || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' || order.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Đã thanh toán
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            Chờ thanh toán
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <AlertCircle className="w-3.5 h-3.5" />
            Hết hạn
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      {/* Table Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Danh Sách Đơn Hàng</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quản lý và đối soát các đơn hàng VietQR được tạo trên hệ thống
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Bộ lọc trạng thái */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filterStatus === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Tất cả ({orders.length})
            </button>
            <button
              onClick={() => setFilterStatus('PENDING')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filterStatus === 'PENDING'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Chờ ({orders.filter((o) => o.status === 'PENDING').length})
            </button>
            <button
              onClick={() => setFilterStatus('PAID')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filterStatus === 'PAID'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Đã trả ({orders.filter((o) => o.status === 'PAID').length})
            </button>
          </div>

          {/* Ô tìm kiếm */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm mã đơn, nội dung..."
              className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3.5">Mã đơn</th>
              <th className="px-5 py-3.5">Nội dung Unique</th>
              <th className="px-5 py-3.5">Mô tả</th>
              <th className="px-5 py-3.5 text-right">Số tiền</th>
              <th className="px-5 py-3.5">Trạng thái</th>
              <th className="px-5 py-3.5">Thời gian</th>
              <th className="px-5 py-3.5 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    <span>Đang nạp danh sách đơn hàng...</span>
                  </div>
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <span>Không tìm thấy đơn hàng nào</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const isPaid = order.status === 'PAID';
                return (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        {order.orderCode}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate max-w-[120px]">
                        {order.id}
                      </div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-800 text-xs">
                          {order.uniqueTransferCode}
                        </span>
                        <button
                          onClick={() => handleCopy(order.uniqueTransferCode)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                          title="Sao chép mã"
                        >
                          {copiedCode === order.uniqueTransferCode ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                      {order.description || 'Không có mô tả'}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-right font-black text-slate-900 dark:text-white">
                      {order.amount.toLocaleString('vi-VN')} đ
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                      <div>Tạo: {new Date(order.createdAt).toLocaleTimeString('vi-VN')}</div>
                      {order.paidAt && (
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          Trả: {new Date(order.paidAt).toLocaleTimeString('vi-VN')}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-right space-x-2">
                      {/* Nút test nhanh nếu đang chờ */}
                      {!isPaid && (
                        <button
                          onClick={() => handleMockPay(order.id)}
                          disabled={payingOrderId === order.id}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors cursor-pointer"
                          title="Kích hoạt thanh toán mô phỏng"
                        >
                          <Zap className={`w-3 h-3 ${payingOrderId === order.id ? 'animate-spin' : ''}`} />
                          <span>{payingOrderId === order.id ? 'Đang duyệt...' : 'Test duyệt'}</span>
                        </button>
                      )}

                      {/* Nút mở trang checkout và tự động set lại 15 phút */}
                      <button
                        type="button"
                        onClick={() => handleOpenCheckout(order)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                        title="Đi tới trang thanh toán VietQR (Tự động set lại 15 phút)"
                      >
                        <span>Thanh toán</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
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
