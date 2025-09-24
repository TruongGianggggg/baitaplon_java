import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderApiService } from '../../../core/services/order-api.service';
import { Order } from '../../../shared/models/order.model';

@Component({
  standalone: true,
  selector: 'app-order-detail',
  imports: [CommonModule, RouterLink, DatePipe, CurrencyPipe],
  templateUrl: './order-detail.component.html',
})
export class OrderDetailComponent implements OnInit {
  private api = inject(OrderApiService);
  private route = inject(ActivatedRoute);

  loading = signal<boolean>(false);
  error = signal<string>('');
  order = signal<Order | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id') || 0);
    if (!id) {
      this.error.set('Thiếu id đơn hàng');
      return;
    }
    this.fetch(id);
  }

  fetch(id: number) {
    this.loading.set(true);
    this.error.set('');
    this.api.get(id).subscribe({
      next: (o: Order) => {
        this.order.set(o);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set(err?.error?.message || 'Không tải được chi tiết đơn hàng');
        this.loading.set(false);
      }
    });
  }

  createdAt(): any {
    const anyO = this.order() as any;
    return anyO?.createdAt ?? anyO?.createdDate ?? anyO?.created_on;
  }

  status(): string {
    return (this.order() as any)?.status ?? 'UNKNOWN';
  }

  items(): any[] {
    const anyO = this.order() as any;
    const arr = anyO?.items ?? anyO?.orderItems ?? [];
    return Array.isArray(arr) ? arr : [];
  }

  itemPrice(it: any): number {
    return it?.price ?? it?.unitPrice ?? it?.amount ?? 0;
  }

  itemQty(it: any): number {
    return it?.quantity ?? it?.qty ?? 1;
  }

  total(): number {
    const anyO = this.order() as any;
    return anyO?.totalAmount ?? anyO?.totalPrice ?? anyO?.amount ?? 0;
  }
}
