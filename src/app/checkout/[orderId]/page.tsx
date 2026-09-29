'use client';

import { CountdownTimer } from '@/components/checkout/CountdownTimer';
import { PaymentDetails } from '@/components/checkout/PaymentDetails';
import { QrCard } from '@/components/checkout/QrCard';
import { SuccessState } from '@/components/checkout/SuccessState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Order } from '@/types/order';
import { ArrowLeft, RefreshCw, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CheckoutPage() {
  const params = useParams();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [polling, setPolling] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Lấy và polling trạng thái đơn hàng mỗi 2.5s
  useEffect(() => {
    if (!orderId) return;

    let isMounted = true;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`);
        const json = await res.json();
        if (json.success && isMounted) {
          setOrder(json.order);
          setLoading(false);

          if (json.order.status === 'PAID' || json.order.status === 'EXPIRED') {
            setPolling(false);
          }
        }
      } catch (err) {
        console.error('Lỗi polling đơn hàng:', err);
      }
    };

    fetchStatus();

    // Polling định kỳ
    const interval = setInterval(() => {
      if (polling) {
        fetchStatus();
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [orderId, polling]);

  // Nút giả lập chuyển tiền (Mock Payment) để người dùng test ngay luồng thành công
  const handleSimulatePayment = async () => {
    if (!orderId) return;
    setIsSimulating(true);
    try {
      await fetch('/api/orders/mock-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      // Polling sẽ tự động nhận diện trong 2.5s tiếp theo
    } catch (err) {
      console.error('Lỗi khi giả lập thanh toán:', err);
    } finally {
      setTimeout(() => setIsSimulating(false), 2000);
    }
  };

  // Nút gia hạn đơn hàng thêm 15 phút
  const handleRenewOrder = async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/renew`, { method: 'POST' });
      const json = await res.json();
      if (json.success && json.order) {
        setOrder(json.order);
        setPolling(true);
      }
    } catch (err) {
      console.error('Lỗi khi gia hạn đơn hàng:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Đang tạo mã thanh toán VietQR...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Không tìm thấy đơn hàng</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          Đơn hàng này không tồn tại hoặc đã hết hạn từ lâu.
        </p>
        <Link href="/">
          <Button variant="primary">Trở về trang chủ</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Header điều hướng */}
      <div className="mb-6 flex justify-between items-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại trang tạo đơn</span>
        </Link>
        <Badge status={order.status} />
      </div>

      {order.status === 'PAID' ? (
        <Card className="max-w-lg mx-auto">
          <SuccessState order={order} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cột trái: Khung QR Code */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <Card className="w-full flex flex-col items-center p-6 sm:p-8">
              <div className="w-full flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500">QUÉT MÃ VIETQR</span>
                <CountdownTimer
                  expiresAt={order.expiresAt}
                  onExpire={() => setOrder((prev) => (prev ? { ...prev, status: 'EXPIRED' } : null))}
                />
              </div>

              <QrCard order={order} isPolling={polling} />
            </Card>

            {/* Hộp gia hạn khi đơn đã hết hạn */}
            {order.status === 'EXPIRED' && (
              <div className="mt-4 w-full p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-center space-y-2.5 shadow-sm">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                  ⚠️ Đơn hàng đã quá thời hạn 15 phút!
                </p>
                <button
                  type="button"
                  onClick={handleRenewOrder}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Set lại 15 phút để tiếp tục thanh toán</span>
                </button>
              </div>
            )}

            {/* Nút Test Giả lập Thanh toán nhanh cho demo */}
            <div className="mt-4 w-full">
              <button
                onClick={handleSimulatePayment}
                disabled={isSimulating || order.status !== 'PENDING'}
                className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98"
              >
                <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-500/20" />
                {isSimulating ? 'Đang kích hoạt...' : '⚡ Thử nghiệm: Giả lập chuyển khoản thành công'}
              </button>
            </div>
          </div>

          {/* Cột phải: Chi tiết thanh toán */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="p-6 sm:p-8">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-5 mb-6">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Chi Tiết Đơn Hàng #{order.orderCode}
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {order.description}
                </h1>
              </div>

              <PaymentDetails order={order} />

              {/* Thông tin bảo mật */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Xác thực tự động qua cổng MBBank VietQR 24/7</span>
                </div>
                <div className="flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  <span className="text-[11px] text-blue-500 font-medium">Đang lắng nghe...</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
