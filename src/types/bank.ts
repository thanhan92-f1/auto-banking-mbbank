export interface MBBankTransaction {
  transactionId: string;
  refNo: string;
  amount: number;
  type: 'IN' | 'OUT';
  content: string;
  transactionDate: Date;
  accountReceiver: string;
  raw?: any;
}

export interface MBBankBalance {
  accountNo: string;
  accountName: string;
  balance: number;
  currency: string;
  updatedAt: Date;
}

export interface MBBankSessionState {
  sessionId: string | null;
  deviceId: string;
  token?: string;
  lastLoginAt?: Date;
  expiresAt?: Date;
  isLoggedIn: boolean;
  loginError?: string;
}
