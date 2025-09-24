import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import {
  Order,
  CheckoutRequest,
  CheckoutResponse
} from '../../shared/models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderApiService {
  private http = inject(HttpClient);
  // BE map: /api/orders
  private base = `${environment.apiUrl}/api/orders`;

  list(): Observable<Order[]> {
    return this.http.get<Order[]>(this.base);
  }

  get(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.base}/${id}`);
  }

  checkout(req: CheckoutRequest): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${this.base}/checkout`, req);
  }

  byUser(userId: number): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.base}/user/${userId}`);
  }

}
