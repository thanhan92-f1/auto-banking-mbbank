import { ENV } from '@/config/env';

export interface VietQRParams {
  accountNo: string;
  accountName: string;
  amount: number;
  content: string;
  bankBin?: string;
  template?: 'compact' | 'compact2' | 'qr_only' | 'print';
}

export interface VietQRResult {
  qrImageUrl: string;
  accountNo: string;
  accountName: string;
  amount: number;
  content: string;
  bankName: string;
}

/**
 * Sinh mã VietQR chuẩn theo tài liệu https://www.vietqr.io/
 */
export function generateVietQR(params: VietQRParams): VietQRResult {
  const bankBin = params.bankBin || ENV.MB.BANK_BIN; // 970422 (MBBank)
  const template = params.template || 'compact2';

  const cleanAccountNo = params.accountNo.trim();
  const cleanAccountName = params.accountName.trim();
  const encodedName = encodeURIComponent(cleanAccountName);
  const encodedContent = encodeURIComponent(params.content.trim());

  // Link ảnh VietQR chính thức
  const qrImageUrl = `https://img.vietqr.io/image/${bankBin}-${cleanAccountNo}-${template}.png?amount=${params.amount}&addInfo=${encodedContent}&accountName=${encodedName}`;

  return {
    qrImageUrl,
    accountNo: cleanAccountNo,
    accountName: cleanAccountName,
    amount: params.amount,
    content: params.content,
    bankName: 'MBBANK (Ngân hàng Quân Đội)',
  };
}

/**
 * Sinh mã chuyển khoản Unique ngẫu nhiên
 * Ví dụ: "MBB" + 6 ký tự số/chữ ngẫu nhiên: "MBB829103"
 */
export function generateUniqueTransferCode(prefix: string = 'MBB'): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomStr = '';
  for (let i = 0; i < 5; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${randomStr}`;
}
