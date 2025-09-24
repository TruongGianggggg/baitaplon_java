// src/app/features/auth/user/orders-page.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderApiService } from '../../../core/services/order-api.service';
import { Order } from '../../../shared/models/order.model';

@Component({
  standalone: true,
  selector: 'app-orders-page',
  imports: [CommonModule, RouterLink, DatePipe, CurrencyPipe],
  templateUrl: './orders-page.component.html',
})
export class OrdersPageComponent implements OnInit {
  private api = inject(OrderApiService);

  loading = signal<boolean>(false);
  error = signal<string>('');
  orders = signal<Order[]>([]);

  ngOnInit(): void {
    // TODO: thay 1 bằng userId thực từ AuthService
    this.fetch(1);
  }

  fetch(userId: number) {
    this.loading.set(true);
    this.error.set('');
    this.api.byUser(userId).subscribe({
      next: (data: Order[]) => {
        this.orders.set(Array.isArray(data) ? data : []);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set(err?.error?.message || 'Không tải được danh sách đơn hàng');
        this.loading.set(false);
      }
    });
  }

  badge(status?: string): string {
    const s = (status || '').toUpperCase();
    if (s === 'PAID' || s === 'COMPLETED') return 'bg-green-100 text-green-700';
    if (s === 'PENDING') return 'bg-yellow-100 text-yellow-700';
    if (s === 'CANCELLED') return 'bg-red-100 text-red-700';
    if (s === 'SHIPPED' || s === 'DELIVERING') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  }

  total(o: Order): number {
    const anyO = o as any;
    return anyO.totalAmount ?? anyO.totalPrice ?? anyO.amount ?? 0;
  }

  code(o: Order): string {
    const anyO = o as any;
    return anyO.code ?? `#${o.id}`;
  }

  createdAt(o: Order): string | Date | undefined {
    const anyO = o as any;
    return anyO.createdAt ?? anyO.createdDate ?? anyO.created_on;
  }

  /** 👇 Thêm hàm này để template bind đơn giản, tránh lỗi parser */
  status(o: Order): string {
    return (o as any)?.status ?? 'UNKNOWN';
  }
}
