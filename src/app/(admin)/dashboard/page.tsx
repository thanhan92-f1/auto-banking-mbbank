'use client';

import React, { useEffect, useState } from 'react';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { TransactionTable } from '@/components/dashboard/TransactionTable';
import { SessionStatus } from '@/components/dashboard/SessionStatus';
import { OrderTable } from '@/components/dashboard/OrderTable';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MBBankTransaction, MBBankBalance, MBBankSessionState } from '@/types/bank';
import { Order } from '@/types/order';
import { PlusCircle, RefreshCw, Layers, ShieldCheck, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [balance, setBalance] = useState<number>(0);
  const [accountNo, setAccountNo] = useState<string>('0987654321');
  const [accountName, setAccountName] = useState<string>('NGUYEN VAN A');
  const [session, setSession] = useState<MBBankSessionState>({
    sessionId: null,
    deviceId: '',
    isLoggedIn: false,
  });
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<MBBankTransaction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = async () => {
    try {
      // 1. Lấy số dư và trạng thái phiên
      const balanceRes = await fetch('/api/bank/balance');
      const balanceJson = await balanceRes.json();
      if (balanceJson.success) {
        setBalance(balanceJson.data.balance || 0);
        setAccountNo(balanceJson.data.accountNo);
        setAccountName(balanceJson.data.accountName);
        setSession(balanceJson.data.session);
        setIsConfigured(balanceJson.data.isConfigured);
      }

      // 2. Lấy danh sách đơn hàng VietQR
      const ordersRes = await fetch('/api/orders');
      const ordersJson = await ordersRes.json();
      if (ordersJson.success) {
        setOrders(ordersJson.orders || []);
      }

      // 3. Lấy danh sách giao dịch MBBank
      const txRes = await fetch('/api/bank/transactions');
      const txJson = await txRes.json();
      if (txJson.success) {
        setTransactions(txJson.transactions || []);
      }
    } catch (e) {
      console.error('Lỗi nạp dữ liệu dashboard:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    // Định kỳ refresh 15s/lần
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Quản Trị Auto-Banking MBBank
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Hệ thống giải Captcha nội bộ (ONNX) và đối soát VietQR thời gian thực
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            isLoading={refreshing}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>

          <Link href="/">
            <Button variant="primary" size="sm">
              <PlusCircle className="w-4 h-4 mr-2" />
              Tạo đơn test VietQR
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid: Balance Card + Session Status */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-7">
          <BalanceCard
            balance={balance}
            accountNo={accountNo}
            accountName={accountName}
            isLoading={refreshing}
            onRefresh={handleManualRefresh}
          />
        </div>

        <div className="md:col-span-5">
          <SessionStatus
            isLoggedIn={session.isLoggedIn}
            isConfigured={isConfigured}
            lastLoginAt={session.lastLoginAt ? String(session.lastLoginAt) : undefined}
            expiresAt={session.expiresAt ? String(session.expiresAt) : undefined}
            deviceId={session.deviceId}
            error={session.loginError}
          />
        </div>
      </div>

      {/* Bảng Quản Lý Đơn Hàng VietQR */}
      <div>
        <OrderTable orders={orders} isLoading={loading} onRefresh={loadData} />
      </div>

      {/* Bảng Lịch Sử Biến Động Số Dư MBBank */}
      <div>
        <TransactionTable transactions={transactions} isLoading={loading} onRefresh={loadData} />
      </div>
    </div>
  );
}
