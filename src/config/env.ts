export const ENV = {
  MB: {
    LOGIN_ID: process.env.MB_LOGIN_ID || '',
    PASSWORD: process.env.MB_PASSWORD || '',
    SESSION_ID: process.env.MB_SESSION_ID || '',
    DEVICE_ID: process.env.MB_DEVICE_ID || '',
    ACCOUNT_NO: process.env.MB_ACCOUNT_NO || '0987654321',
    ACCOUNT_NAME: process.env.MB_ACCOUNT_NAME || 'NGUYEN VAN A',
    BANK_CODE: 'MB', // MBBank Napas Code: 970422 / MB
    BANK_BIN: '970422',
  },
  POLLER: {
    SHARED_CACHE_TTL_MS: 4000, // Cache sao kê 4s để chống spam
    DEFAULT_INTERVAL_MS: 5000, // Tần suất quét tự động
    MAX_HISTORY_DAYS: 3,       // Quét lùi 3 ngày
  },
  ORDER: {
    DEFAULT_EXPIRY_MINUTES: 15,
  }
};
