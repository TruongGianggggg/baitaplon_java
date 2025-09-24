import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiUser, ApiUserPartial } from '../../../shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class AdminUserApi {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/users`;

  // GET /api/users?q=...
  list(q = '') {
    const params = q ? new HttpParams().set('q', q) : undefined;
    return this.http.get<ApiUser[]>(this.base, { params });
  }

  // POST /api/users
  create(body: Partial<ApiUser>) {
    return this.http.post<ApiUser>(this.base, body);
  }

  // PUT /api/users/{id}?admin=true   (dựa vào PUT sẵn có của bạn)
  update(id: number, patch: ApiUserPartial) {
    return this.http.put<ApiUser>(`${this.base}/${id}`, patch, {
      params: new HttpParams().set('admin', 'true'),
    });
  }

  // DELETE /api/users/{id}
  delete(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
