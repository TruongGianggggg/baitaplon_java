export interface Product {
  id: number;
  name: string;
  price: number;          // đơn giá (BigDecimal từ BE -> number)
  currency?: string;      // optional, FE hiển thị 'VND' mặc định
  coverImage?: string;    // optional nếu bạn có ảnh
}

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  price: number;          // line total = product.price * quantity (BE đã set)
}

export interface Cart {
  id?: number;
  items: CartItem[];
  totalAmount?: number;   // BE có thể không trả; FE sẽ tự tính nếu thiếu
}

/** Alias để fix các import cũ: `CartProduct` */
export type CartProduct = Product;
