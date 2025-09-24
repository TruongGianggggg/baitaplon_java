export type CategoryBrief = {
  id: number;
  name: string;
};

export type Product = {
  id?: number;
  name: string;
  slug: string;
  sku: string;
  description?: string;
  price: number;
  currency: string;
  stock: number;
  enabled: boolean;
  // Một số template của bạn đang dùng previousPrice -> cho optional để tránh lỗi
  previousPrice?: number;

  category?: CategoryBrief | null;
  coverImage?: string | null;
  detailImages?: string[] | null;
  createdAt?: string;
  updatedAt?: string;
};
