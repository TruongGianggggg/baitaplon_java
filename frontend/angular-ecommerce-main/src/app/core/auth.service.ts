import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { TokenStorage } from './token-storage.service';
import { UserApi } from './user.api';
import {
  ApiUser, ApiUserPartial,
  LoginRequest, RegisterRequest, LoginResponse
} from '../shared/models/user.model';

type JwtPayload = {
  sub?: string | number;
  email?: string;
  roles?: string[] | string;
  authorities?: string[] | string;
  userId?: number | string;
  id?: number | string;
  uid?: number | string;
  exp?: number;
  [k: string]: any;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private store = inject(TokenStorage);
  private api = inject(UserApi);

  // Nạp sẵn cache để UI có dữ liệu ngay
  private _token = signal<string>(this.store.get());
  private _user  = signal<ApiUser | null>(this.store.getUser());

  readonly token = this._token;
  readonly user  = this._user;
  readonly isLoggedIn = computed(() => !!this._token());
  readonly isAdmin = computed(() => {
    const r = this._user()?.roles ?? [];
    return Array.isArray(r) && r.includes('ADMIN');
  });

  constructor() {
    // Làm tươi hồ sơ bằng getById nếu có id (từ JWT hoặc cache)
    effect(() => {
      const t = this._token();
      if (!t) { this._user.set(null); this.store.setUser(null); this.store.setUserId(null); return; }

      let id = this.readUserIdFromJwt(t);
      if (!id) id = this.store.getUserId();
      if (!id) return;

      this.api.getById(id).subscribe({
        next: (u) => {
          const merged = this.normalizeUser(u, t);
          this._user.set(merged);
          this.store.setUser(merged);
          if (merged.id != null) this.store.setUserId(merged.id);
        },
        error: (_err) => { /* không logout ở đây để tránh xóa UI */ },
      });
    });
  }

  // ==== ACTIONS ====
  login(body: LoginRequest) {
    return this.api.login(body).subscribe({
      next: (res: LoginResponse) => this.applyAuthResponse(res),
      error: (_err) => {},
    });
  }

  register(body: RegisterRequest) {
    return this.api.register(body).subscribe({
      next: (res: any) => this.applyAuthResponse(res),
      error: (_err) => {},
    });
  }

  logout() {
    this.store.clear();
    this._token.set('');
    this._user.set(null);
  }

  applyUser(patch: ApiUserPartial) {
    const prev = this._user();
    const merged: ApiUser = { ...(prev ?? {} as ApiUser), ...(patch as ApiUserPartial) } as ApiUser;
    this._user.set(merged);
    this.store.setUser(merged);
    if (merged.id != null) this.store.setUserId(merged.id);
  }

  // ==== PRIVATE HELPERS ====
  private applyAuthResponse(res: LoginResponse | any) {
    const token = res?.access_token || res?.token || res?.jwt || '';
    if (token) { this.store.set(token); this._token.set(token); }

    if (res?.user) {
      const u = this.normalizeUser(res.user, token);
      this._user.set(u);
      this.store.setUser(u);
      if (u.id != null) this.store.setUserId(u.id); // cache id ngay sau login
    } else if (token) {
      const payload = this.readPayload(token);
      const id = this.readUserIdFromJwt(token);
      const u: ApiUser = { id: id ?? 0, email: payload?.email ?? '', roles: this.readRolesFromJwt(token) };
      this._user.set(u);
      this.store.setUser(u);
      if (id != null) this.store.setUserId(id);
    }
  }

  private normalizeUser(raw: any, token?: string): ApiUser {
    const roles = (raw?.roles && raw.roles.length) ? raw.roles : (token ? this.readRolesFromJwt(token) : []);
    return {
      id: Number(raw?.id ?? 0),
      email: raw?.email ?? '',
      roles,
      fullName: raw?.fullName ?? '',
      phone: raw?.phone ?? '',
      addressLine1: raw?.addressLine1 ?? '',
      addressLine2: raw?.addressLine2 ?? '',
      ward: raw?.ward ?? '',
      district: raw?.district ?? '',
      city: raw?.city ?? '',
      postalCode: raw?.postalCode ?? '',
      country: raw?.country ?? '',
      enabled: raw?.enabled ?? true,
    };
  }

  private readUserIdFromJwt(token: string): number | null {
    try {
      const p = this.readPayload(token);
      const raw = p?.userId ?? p?.id ?? p?.uid ?? p?.sub;
      if (raw == null) return null;
      const n = typeof raw === 'string' ? Number(raw) : Number(raw);
      return Number.isFinite(n) ? n : null;
    } catch { return null; }
  }

  private readRolesFromJwt(token: string): string[] {
    try {
      const p = this.readPayload(token);
      let roles: any = p?.roles ?? p?.authorities ?? [];
      if (typeof roles === 'string') {
        try { const parsed = JSON.parse(roles); if (Array.isArray(parsed)) roles = parsed; }
        catch { roles = roles.split(',').map((s: string) => s.trim()); }
      }
      return Array.isArray(roles) ? roles : [];
    } catch { return []; }
  }

  private readPayload(token: string): JwtPayload | null {
    try {
      const base64 = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
      if (!base64) return null;
      const json = decodeURIComponent(escape(atob(base64)));
      return JSON.parse(json) as JwtPayload;
    } catch { return null; }
  }


  get userId(): number {
  return this._user()?.id ?? 0;
}

  get userProfile() {
  return this._user();
 }
}

