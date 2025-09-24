import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageResponse } from '../../shared/models/page-response.model';
import { Category } from '../../shared/models/category';

@Injectable({ providedIn: 'root' })
export class CategoryApiService {
  private http = inject(HttpClient);

  // Chuẩn hóa để luôn có hậu tố /api
  private readonly root = environment.apiUrl.replace(/\/+$/, '');
  private readonly baseUrl = `${this.root}${this.root.endsWith('/api') ? '' : '/api'}/categories`;

  /** Danh sách có phân trang + lọc */
  search(opts: {
    keyword?: string;
    enabled?: boolean;
    page?: number;
    size?: number;
    sort?: string; // ví dụ: 'id,desc'
  }): Observable<PageResponse<Category>> {
    let params = new HttpParams();
    if (opts.keyword) params = params.set('keyword', opts.keyword);
    if (opts.enabled !== undefined) params = params.set('enabled', opts.enabled);
    if (opts.page !== undefined) params = params.set('page', opts.page);
    if (opts.size !== undefined) params = params.set('size', opts.size);
    if (opts.sort) params = params.set('sort', opts.sort);

    return this.http.get<PageResponse<Category>>(this.baseUrl, {
      params,
      withCredentials: true,
    });
  }

  /** Lấy tất cả (tiện cho dropdown) */
  listAll(): Observable<Category[]> {
    return this.http
      .get<PageResponse<Category>>(this.baseUrl, {
        params: { size: 9999, sort: 'name,asc' },
        withCredentials: true,
      })
      .pipe(map((res) => res.content ?? []));
  }

  get(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }

  create(c: Category): Observable<Category> {
    return this.http.post<Category>(this.baseUrl, c, { withCredentials: true });
  }

  update(id: number, patch: Category): Observable<Category> {
    return this.http.put<Category>(`${this.baseUrl}/${id}`, patch, { withCredentials: true });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }
}
