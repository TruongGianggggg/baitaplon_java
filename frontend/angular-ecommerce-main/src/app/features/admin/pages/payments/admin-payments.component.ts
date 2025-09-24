// src/app/pages/admin/payments/admin-payments.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Payment, PaymentStatus } from '../../../../shared/models/payment';
import { PaymentService } from '../../../../core/services/payment.service';

@Component({
  standalone: true,
  selector: 'app-admin-payments',
  imports: [CommonModule],
  templateUrl: './admin-payments.component.html',
})
export class AdminPaymentsComponent implements OnInit {
  private api = inject(PaymentService);

  payments: Payment[] = [];
  selected: Payment | null = null;

  loadingList = false;
  loadingDetail = false;
  errorList = '';

  ngOnInit(): void { this.reload(); }

  trackById = (_: number, p: Payment) => p.id;

  reload(): void {
    this.loadingList = true;
    this.errorList = '';
    this.selected = null;

    this.api.list().subscribe({
      next: (data) => { this.payments = data ?? []; this.loadingList = false; },
      error: (err) => {
        const e = err as any;
        this.errorList = e?.error?.message || 'Không tải được danh sách thanh toán';
        this.loadingList = false;
      },
    });
  }

  viewDetail(id: number): void {
    this.loadingDetail = true;
    this.api.get(id).subscribe({
      next: (p) => { this.selected = p; this.loadingDetail = false; },
      error: () => { this.loadingDetail = false; alert('Không tải được chi tiết payment'); },
    });
  }

  statusClass(status?: Payment['status']): string {
    const base = 'px-2 py-1 rounded text-xs';
    switch (status as PaymentStatus) {
      case 'PAID': return `${base} bg-green-100 text-green-700`;
      case 'PENDING': return `${base} bg-amber-100 text-amber-700`;
      case 'FAILED': return `${base} bg-rose-100 text-rose-700`;
      case 'REFUNDED': return `${base} bg-blue-100 text-blue-700`;
      case 'CANCELLED': return `${base} bg-gray-100 text-gray-700`;
      default: return `${base} bg-gray-100 text-gray-700`;
    }
  }
}
