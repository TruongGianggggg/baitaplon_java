import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Coupon, CouponPreviewResult } from '../../shared/models/coupon.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CouponApiService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/coupons`; // ✅ Spring mapping

  list(): Observable<Coupon[]> {
    return this.http.get<Coupon[]>(this.base);
  }

  get(id: number): Observable<Coupon> {
    return this.http.get<Coupon>(`${this.base}/${id}`);
  }

  create(c: Coupon): Observable<Coupon> {
    return this.http.post<Coupon>(this.base, c);
  }

  update(id: number, patch: Partial<Coupon>): Observable<Coupon> {
    return this.http.put<Coupon>(`${this.base}/${id}`, patch);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  preview(code: string, userId: number) {
    const params = new HttpParams().set('code', code).set('userId', userId);
    return this.http.post<CouponPreviewResult>(`${this.base}/preview`, null, { params });
  }

  redeem(code: string, userId: number, orderId?: number) {
    let params = new HttpParams().set('code', code).set('userId', userId);
    if (orderId) params = params.set('orderId', orderId);
    return this.http.post<{ couponCode: string; discount: string }>(
      `${this.base}/redeem`,
      null,
      { params }
    );
  }
}
