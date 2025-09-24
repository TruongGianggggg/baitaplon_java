import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  ApiUser, ApiUserPartial,
  LoginRequest, RegisterRequest, LoginResponse
} from '../shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class UserApi {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/users`;

  register(req: RegisterRequest) {
    return this.http.post<Record<string, any>>(`${this.base}/register`, req);
  }

  login(req: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.base}/login`, req);
  }

  getById(id: number) {
    return this.http.get<ApiUser>(`${this.base}/${id}`);
  }

  update(id: number, patch: ApiUserPartial) {
    return this.http.put<ApiUser>(`${this.base}/${id}`, patch);
  }
}
