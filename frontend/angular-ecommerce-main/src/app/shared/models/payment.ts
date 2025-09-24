// src/app/shared/models/payment.ts
import { CartProduct } from './cart-product';

export interface PaymentDto {
  products: CartProduct[];
  total: number;
}

export type PaymentMethod =
  | 'VNPAY' | 'COD' | 'MOMO' | 'BANK' | 'OTHER';

export type PaymentStatus =
  | 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface Payment {
  id: number;

  // BE trả orderId (Long) -> FE dùng số, không phải object lồng order:{id}
  orderId?: number | null;

  method?: PaymentMethod;
  status?: PaymentStatus;
  provider?: string | null;
  amount?: number;
  txnRef?: string | null;

  bankCode?: string | null;
  bankTranNo?: string | null;
  transactionNo?: string | null;
  responseCode?: string | null;

  // BE có thêm 2 field này, thêm để hiển thị nếu cần
  orderInfo?: string | null;
  payDate?: string | null;

  createdAt?: string | null;
}
