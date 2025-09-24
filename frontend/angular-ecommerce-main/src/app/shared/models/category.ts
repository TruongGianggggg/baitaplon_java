export type Category = {
  id?: number;
  name: string;
  slug: string;
  description?: string | null;
  enabled: boolean;
  createdAt?: string;  // map created_at
  updatedAt?: string;  // map updated_at
};
