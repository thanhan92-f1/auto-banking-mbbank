'use client';

import React from 'react';
import { QrCode, Download, Smartphone } from 'lucide-react';
import { Order } from '@/types/order';

interface QrCardProps {
  order: Order;
  isPolling?: boolean;
}

export const QrCard: React.FC<QrCardProps> = ({ order, isPolling = true }) => {
  return (
    <div className="flex flex-col items-center">
      {/* Khung QR Code chuẩn VietQR */}
      <div className="relative p-3 bg-white rounded-2xl shadow-xl shadow-slate-200/60 dark:shadow-slate-950/50 border border-slate-200/80 dark:border-slate-800 group transition-transform duration-300 hover:scale-[1.01]">
        {/* Scanning Laser Animation Effect */}
        {isPolling && (
          <div className="absolute inset-x-3 top-3 overflow-hidden h-[calc(100%-24px)] rounded-xl pointer-events-none z-10">
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_12px_rgba(59,130,246,0.8)] animate-[scan_2.5s_ease-in-out_infinite]" />
          </div>
        )}

        {/* Ảnh VietQR */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={order.qrUrl}
          alt={`Mã VietQR thanh toán cho đơn hàng ${order.orderCode}`}
          className="w-64 h-auto rounded-xl object-contain"
        />

        {/* Trạng thái quét trực tiếp */}
        <div className="absolute bottom-5 inset-x-5 py-1.5 px-3 bg-slate-900/85 backdrop-blur-md rounded-lg text-white text-[11px] font-medium flex items-center justify-center gap-2 opacity-90 shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Tự động nhận diện thanh toán
        </div>
      </div>

      {/* Hướng dẫn quét */}
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Smartphone className="w-4 h-4 text-blue-500" />
        <span>Mở App ngân hàng hoặc Ví điện tử bất kỳ để quét</span>
      </div>

      {/* Nút tải ảnh QR */}
      <a
        href={order.qrUrl}
        target="_blank"
        rel="noopener noreferrer"
        download={`vietqr_${order.orderCode}.png`}
        className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
      >
        <Download className="w-3.5 h-3.5" />
        Tải ảnh mã QR về máy
      </a>
    </div>
  );
};
