import { Injectable } from '@angular/core';
import { ApiUser } from '../shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class TokenStorage {
  private KEY = 'access_token';
  private USER_KEY = 'auth_user';
  private USER_ID_KEY = 'auth_user_id';

  set(token: string) { localStorage.setItem(this.KEY, token); }
  get() { return localStorage.getItem(this.KEY) || ''; }
  clear() {
    localStorage.removeItem(this.KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.USER_ID_KEY);
  }

  setUser(u: ApiUser | null) {
    if (!u) { localStorage.removeItem(this.USER_KEY); return; }
    localStorage.setItem(this.USER_KEY, JSON.stringify(u));
  }
  getUser(): ApiUser | null {
    try { return JSON.parse(localStorage.getItem(this.USER_KEY) || 'null'); }
    catch { return null; }
  }

  setUserId(id: number | null) {
    if (id == null) { localStorage.removeItem(this.USER_ID_KEY); return; }
    localStorage.setItem(this.USER_ID_KEY, String(id));
  }
  getUserId(): number | null {
    const s = localStorage.getItem(this.USER_ID_KEY);
    const n = s ? Number(s) : NaN;
    return Number.isFinite(n) ? n : null;
  }
}
