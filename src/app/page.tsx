'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { QrCode, Cpu, ShieldCheck, Zap, ArrowRight, Sparkles, CheckCircle, Volume2 } from 'lucide-react';
import Link from 'next/link';
import { announcePaymentSuccess } from '@/utils/speaker';

export default function HomePage() {
  const router = useRouter();

  const [selectedAmount, setSelectedAmount] = useState<number>(50000);
  const [description, setDescription] = useState<string>('Nâng cấp tài khoản VIP');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [customAmount, setCustomAmount] = useState<string>('100000');
  const [loading, setLoading] = useState<boolean>(false);
  const [isTestingVoice, setIsTestingVoice] = useState<boolean>(false);

  const presetPackages = [
    { title: 'Ủng hộ cà phê', amount: 20000, desc: 'Donate cà phê cho lập trình viên' },
    { title: 'Tài khoản VIP 1 Tháng', amount: 50000, desc: 'Nâng cấp tài khoản VIP 1 tháng' },
    { title: 'Khoá Học AI Fullstack', amount: 200000, desc: 'Đăng ký khoá học AI Agent & Next.js' },
  ];

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const finalAmount = isCustom ? Number(customAmount) || 10000 : selectedAmount;

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          description: description || 'Thanh toán đơn hàng',
        }),
      });

      const json = await res.json();
      if (json.success && json.order) {
        router.push(`/checkout/${json.order.id}`);
      } else {
        alert(`Lỗi tạo đơn: ${json.error || 'Không xác định'}`);
        setLoading(false);
      }
    } catch (err: any) {
      alert(`Lỗi kết nối: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-xs font-semibold text-blue-600 dark:text-blue-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Hệ Thống Tự Động MBBank & VietQR NAPAS 247</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          Cổng Thanh Toán VietQR Tự Động Với{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            AI Giải Captcha MBBank
          </span>
        </h1>

        <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Tạo mã QR thanh toán động kèm nội dung unique. Nhúng trực tiếp model ONNX nội bộ giải Captcha trong{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-200">~10ms</span> bằng Node.js thuần, đối soát tự động mà không cần bên thứ ba.
        </p>

        <div className="pt-2 flex justify-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline">
              Vào Dashboard Quản Trị
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Demo Order Form */}
      <div className="max-w-xl mx-auto">
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-blue-600" />
              Thử Nghiệm Tạo Đơn Hàng Thanh Toán
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Chọn gói sản phẩm hoặc nhập số tiền để trải nghiệm luồng quét mã VietQR tự động.
            </p>
          </div>

          <form onSubmit={handleCreateOrder} className="space-y-5">
            {/* Chọn gói sẵn có */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Chọn gói thanh toán:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {presetPackages.map((pkg) => {
                  const isSelected = !isCustom && selectedAmount === pkg.amount;
                  return (
                    <button
                      key={pkg.amount}
                      type="button"
                      onClick={() => {
                        setIsCustom(false);
                        setSelectedAmount(pkg.amount);
                        setDescription(pkg.desc);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{pkg.title}</p>
                      <p className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                        {pkg.amount.toLocaleString('vi-VN')} đ
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hoặc số tiền tùy ý */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Số tiền (VNĐ):
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustom(!isCustom)}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  {isCustom ? 'Chọn gói gợi ý' : 'Nhập số tiền tùy ý'}
                </button>
              </div>

              {isCustom ? (
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập số tiền (vd: 50000)"
                  required
                />
              ) : (
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-blue-600 dark:text-blue-400">
                  {selectedAmount.toLocaleString('vi-VN')} VNĐ
                </div>
              )}
            </div>

            {/* Mô tả đơn */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mô tả đơn hàng:
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập ghi chú đơn hàng"
                required
              />
            </div>

            {/* Tính năng Loa phát thanh thông báo chuyển khoản (SoundBox) */}
            <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Loa thông báo giọng nói:
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    setIsTestingVoice(true);
                    const finalAmount = isCustom ? Number(customAmount) || 10000 : selectedAmount;
                    await announcePaymentSuccess(finalAmount, description || 'Thanh toán đơn hàng');
                    setIsTestingVoice(false);
                  }}
                  disabled={isTestingVoice}
                  className="text-xs font-medium text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 shadow-xs cursor-pointer flex items-center gap-1 transition-all"
                >
                  <Volume2 className={`w-3 h-3 ${isTestingVoice ? 'animate-bounce text-blue-500' : ''}`} />
                  <span>{isTestingVoice ? 'Đang đọc...' : '🔊 Nghe thử giọng đọc'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Khi thanh toán hoàn tất, loa sẽ tự động phát chuông và đọc to số tiền cùng mô tả đơn hàng.
              </p>
            </div>

            <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
              <QrCode className="w-4 h-4 mr-2" />
              Tạo Mã VietQR Thanh Toán Ngay
            </Button>
          </form>
        </Card>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <Card className="p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">ONNX Node.js Solver</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Nhúng trực tiếp trọng số model ONNX vào Node.js với thư viện Sharp và OnnxRuntime, giải Captcha MBBank chỉ trong 10ms.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Cơ Chế Chống Spam</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Bộ đệm Shared Polling Cache gom các yêu cầu kiểm tra, lưu trữ phiên đăng nhập và tự động backoff khi gặp sự cố, bảo vệ an toàn cho tài khoản.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">VietQR Đối Soát Tức Thì</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Sinh mã QR chuẩn NAPAS 247 kèm mã đơn hàng duy nhất. Tự động đối soát giao dịch ngân hàng theo thời gian thực.
          </p>
        </Card>
      </div>
    </div>
  );
}
