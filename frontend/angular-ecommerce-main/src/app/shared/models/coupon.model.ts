export type DiscountType = 'PERCENT' | 'FIXED';
export type TargetType = 'ALL' | 'CATEGORY' | 'PRODUCT';

export interface Coupon {
  id?: number;
  code: string;
  name?: string;
  description?: string;
  discountType: DiscountType;
  discountValue: string;            // dùng string để giữ precision (BigDecimal) rồi parse về number khi hiển thị
  maxDiscountAmount?: string | null;
  minOrderAmount?: string | null;
  targetType: TargetType;
  categories?: { id: number; name?: string }[];
  products?: { id: number; name?: string }[];
  enabled?: boolean;
  startsAt?: string | null;         // ISO (Instant)
  endsAt?: string | null;           // ISO (Instant)
  totalQuantity?: number | null;
  usedCount?: number | null;
  perUserLimit?: number | null;
  stackable?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CouponPreviewResult {
  couponCode: string;
  discount: string;
  subtotal: string;
  totalAfterDiscount: string;
}
