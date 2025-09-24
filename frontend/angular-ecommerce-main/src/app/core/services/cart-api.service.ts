import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Cart } from '../../shared/models/cart-product';

@Injectable({ providedIn: 'root' })
export class CartApiService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/cart';

  // Nếu bạn đăng nhập theo SESSION (JSESSIONID) giữ dòng này.
  // Nếu dùng JWT + Interceptor vẫn để cũng không sao.
  private opts = { withCredentials: true };

  /** FE tự tính totalAmount nếu BE chưa trả */
  private normalize = map((c: Cart) => {
    const total = (c.items ?? []).reduce((s, it) => s + Number(it?.price ?? 0), 0);
    return { ...c, totalAmount: c.totalAmount ?? total };
  });

  getCart(): Observable<Cart> {
    return this.http.get<Cart>(this.baseUrl, this.opts).pipe(this.normalize);
  }

  add(productId: number, quantity: number): Observable<Cart> {
    const params = new HttpParams()
      .set('productId', String(productId))
      .set('quantity', String(Math.max(1, quantity)));
    return this.http.post<Cart>(`${this.baseUrl}/add`, null, { params, ...this.opts }).pipe(this.normalize);
  }

  update(productId: number, quantity: number): Observable<Cart> {
    const params = new HttpParams()
      .set('productId', String(productId))
      .set('quantity', String(Math.max(0, quantity)));
    return this.http.put<Cart>(`${this.baseUrl}/update`, null, { params, ...this.opts }).pipe(this.normalize);
  }

  remove(productId: number): Observable<Cart> {
    const params = new HttpParams().set('productId', String(productId));
    return this.http.delete<Cart>(`${this.baseUrl}/remove`, { params, ...this.opts }).pipe(this.normalize);
  }

  clear(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/clear`, this.opts);
  }
}
