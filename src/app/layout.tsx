import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { Building2, LayoutDashboard, ShoppingBag, ShieldCheck } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Auto-Banking MBBank & VietQR NAPAS 247',
  description: 'Hệ thống tự động hóa MBBank với AI giải Captcha nội bộ và cổng thanh toán VietQR đối soát thời gian thực.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className={`${inter.className} min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 selection:bg-blue-600 selection:text-white`}>
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/80 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-base tracking-tight text-slate-900 dark:text-white">
                  MBBank <span className="text-blue-600">Auto</span>
                </span>
                <span className="ml-1 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  VietQR
                </span>
              </div>
            </Link>

            {/* Menu Links */}
            <nav className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/"
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Tạo Đơn Hàng</span>
              </Link>
              <Link
                href="/dashboard"
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard Quản Trị</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-8 text-center text-xs text-slate-500 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              MBBank Gateway + Node.js ONNX Captcha Solver + VietQR Standard
            </span>
          </div>
          <p>© 2026 Auto-Banking Service. Thiết kế chuẩn Clean Architecture tách biệt UI & Core Logic.</p>
        </footer>
      </body>
    </html>
  );
}
