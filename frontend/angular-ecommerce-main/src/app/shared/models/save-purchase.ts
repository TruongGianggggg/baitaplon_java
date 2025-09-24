export interface SavePurchaseDto {
  total: number;
  products: { id: number; quantity: number }[];
}
