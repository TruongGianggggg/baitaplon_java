export type Role = 'ADMIN' | 'USER' | string;

export interface ApiUser {
  id: number;
  email: string;
  password?: string;       // BE có field này, FE không dùng
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  ward?: string;
  district?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  roles?: Role[];
  enabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ApiUserPartial = Partial<ApiUser>;

export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
}

export interface LoginResponse {
  access_token?: string;
  token?: string;
  jwt?: string;
  user?: ApiUserPartial;
  [k: string]: any;
}
