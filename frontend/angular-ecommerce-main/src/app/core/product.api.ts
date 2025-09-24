import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../shared/models/product';
import { PageResponse } from '../shared/models/page-response.model';

@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/products';

  search(params: {
    keyword?: string; categoryId?: number; enabled?: boolean;
    minPrice?: number; maxPrice?: number; inStock?: boolean;
    page?: number; size?: number; sort?: string;
  }): Observable<PageResponse<Product>> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) p = p.set(k, v as any);
    });
    return this.http.get<PageResponse<Product>>(this.baseUrl, { params: p });
  }

  get(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  create(fd: FormData): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, fd);
  }

  update(id: number, fd: FormData): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/${id}`, fd);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
