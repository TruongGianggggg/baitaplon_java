import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export type SalesRange = '7d' | '30d' | '12m';

export interface DashboardSummary {
  revenue: number;          // tổng doanh thu (VND)
  revenueChangePct: number; // % so với kỳ trước
  ordersToday: number;      // số đơn mới hôm nay
  ordersChangePct: number;  // %
  customersActiveWeek: number;
  customersChangePct: number;
  refunds30d: number;
  refundsChangePct: number;
}

export interface SalesPoint { label: string; value: number; } // cho chart
export interface TopProduct { name: string; total: number; }  // top theo doanh thu
export interface RecentOrder {
  code: string;             // ví dụ: #ORD-1001
  customerName: string;
  createdDate: string;      // ISO
  totalAmount: number;
  status: 'PAID'|'PENDING'|'SHIPPED'|'CANCELLED'|'REFUNDED'|string;
}

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/dashboard`;

  getSummary(): Observable<DashboardSummary> {
    // BE gợi ý: GET /api/dashboard/summary
    return this.http.get<DashboardSummary>(`${this.base}/summary`);
  }

  getSales(range: SalesRange): Observable<SalesPoint[]> {
    // BE gợi ý: GET /api/dashboard/sales?range=7d|30d|12m
    const params = new HttpParams().set('range', range);
    return this.http.get<SalesPoint[]>(`${this.base}/sales`, { params });
  }

  getTopProducts(limit = 3): Observable<TopProduct[]> {
    // BE gợi ý: GET /api/dashboard/top-products?limit=3
    const params = new HttpParams().set('limit', limit);
    return this.http.get<TopProduct[]>(`${this.base}/top-products`, { params });
  }

  getRecentOrders(limit = 5): Observable<RecentOrder[]> {
    // BE gợi ý: GET /api/dashboard/recent-orders?limit=5
    const params = new HttpParams().set('limit', limit);
    return this.http.get<RecentOrder[]>(`${this.base}/recent-orders`, { params });
  }
}
