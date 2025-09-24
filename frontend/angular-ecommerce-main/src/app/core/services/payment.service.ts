// src/app/core/services/payment.service.ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Payment, PaymentDto } from '../../shared/models/payment';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);

  private readonly paymentsBase = `${environment.apiUrl}/api/payments`;
  private readonly ordersBase = `${environment.apiUrl}/api/orders`;

  list(): Observable<Payment[]> {
    return this.http.get<Payment[]>(this.paymentsBase);
  }

  get(id: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.paymentsBase}/${id}`);
  }

  checkout(paymentDto: PaymentDto): Observable<{ checkoutUrl: string }> {
    return this.http.post<{ checkoutUrl: string }>(
      `${this.ordersBase}/checkout`,
      paymentDto
    );
  }

  myHistory(): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.paymentsBase}/me`);
  }
}
