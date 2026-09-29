export type OrderStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';

export interface Order {
  id: string;              // UUID hoặc chuỗi định danh đơn
  orderCode: string;       // Mã code hiển thị, ví dụ: "DH1082"
  uniqueTransferCode: string; // Nội dung chuyển khoản unique, ví dụ: "MBB1082"
  amount: number;          // Số tiền cần thanh toán
  description: string;     // Mô tả đơn hàng
  status: OrderStatus;     // Trạng thái thanh toán
  qrUrl: string;           // URL mã QR VietQR (ảnh)
  qrRaw: string;           // Dữ liệu EMVCo QR code
  bankAccountNo: string;   // STK nhận tiền
  bankAccountName: string; // Tên chủ tài khoản
  bankName: string;        // Ngân hàng (MBBANK)
  createdAt: number;       // Timestamp tạo đơn
  expiresAt: number;       // Timestamp hết hạn (ví dụ: +15 phút)
  paidAt?: number;         // Timestamp thanh toán thành công
  matchedTransactionId?: string; // ID giao dịch khớp
}
