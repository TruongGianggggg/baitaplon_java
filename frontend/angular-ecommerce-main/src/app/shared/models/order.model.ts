export type OrderStatus =
  | 'NEW' | 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED' | 'SHIPPED' | 'COMPLETED';
export type PaymentMethod = 'COD' | 'VNPAY';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface OrderItem {
  productId: number;        // BE trả về productId
  productName: string;      // BE trả về productName
  sku?: string;             // BE trả về sku
  price: string;            // BigDecimal -> string
  quantity: number;
  lineTotal?: string;       // BigDecimal -> string
}

export interface Payment {
  id?: number;
  method: PaymentMethod;
  status: PaymentStatus;
  provider?: string;        // 'VNPAY' | 'COD' | ...
  amount: string;
  transactionId?: string;
  bankCode?: string;
  paidAt?: string;
  createdAt?: string;
}

export interface Order {
  id: number;

  // 👇 đồng bộ với BE: trả phẳng user
  userId: number;
  userEmail?: string;
  userFullName?: string;

  subtotal: string;
  discountAmount: string;
  shippingFee: string;
  totalAmount: string;
  couponCode?: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;

  receiverName?: string;
  receiverPhone?: string;
  shipAddressLine1?: string;
  shipAddressLine2?: string;
  shipWard?: string;
  shipDistrict?: string;
  shipCity?: string;
  shipPostalCode?: string;
  shipCountry?: string;

  createdAt?: string;

  items: OrderItem[];
  itemsTotalQuantity?: number;   // BE trả tổng SL cho list
  payment?: Payment;
}

/** ===== DTOs checkout ===== */
export interface CheckoutItemInput {
  productId: number;
  quantity: number;
}

export interface CheckoutRequest {
  userId: number;                 // nếu BE lấy từ token có thể bỏ field này
  couponCode?: string | null;
  paymentMethod: PaymentMethod;

  receiverName?: string | null;
  receiverPhone?: string | null;
  shipAddressLine1?: string | null;
  shipAddressLine2?: string | null;
  shipWard?: string | null;
  shipDistrict?: string | null;
  shipCity?: string | null;
  shipPostalCode?: string | null;
  shipCountry?: string | null;

  // 👇 thêm để BE tính tiền theo giỏ hàng
  items: CheckoutItemInput[];
}

export interface CheckoutResponseCod {
  orderId: number;
  status: OrderStatus;
  total: string;
}
export interface CheckoutResponseVnpay {
  orderId: number;
  paymentUrl: string;
}
export type CheckoutResponse = CheckoutResponseCod | CheckoutResponseVnpay;

/** tóm tắt để render list lịch sử nếu cần */
export interface OrderSummary {
  id: number;
  createdAt?: string;
  totalAmount: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
}
