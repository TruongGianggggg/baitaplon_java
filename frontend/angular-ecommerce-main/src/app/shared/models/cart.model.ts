export interface Product {
  id: number;
  name: string;
  slug?: string;
  coverImage?: string; // URL ảnh
  // ... các field khác nếu có
}

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  price: number; // backend BigDecimal -> JSON number
}

export interface Cart {
  id: number;
  user?: { id: number; email?: string };
  items: CartItem[];
}
