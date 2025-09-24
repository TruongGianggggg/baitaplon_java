import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Payment, PaymentStatus } from '../shared/models/payment';
import { PaymentService } from '../core/services/payment.service';

@Component({
  standalone: true,
  selector: 'app-payment-history',
  imports: [CommonModule],
  templateUrl: './payment-history.component.html',
})
export class PaymentHistoryComponent implements OnInit, OnDestroy {
  private api = inject(PaymentService);

  payments: Payment[] = [];
  selected: Payment | null = null;

  loadingList = false;
  loadingDetail = false;
  errorList = '';
  errorDetail = '';

  ngOnInit(): void { this.reload(); }
  ngOnDestroy(): void { this.unlockBodyScroll(); }

  trackById = (_: number, p: Payment) => p.id;

  reload(): void {
    this.loadingList = true;
    this.errorList = '';
    this.selected = null;

    this.api.myHistory().subscribe({
      next: (data) => { this.payments = data ?? []; this.loadingList = false; },
      error: (err) => {
        const e = err as any;
        this.errorList = e?.error?.message || 'Không tải được lịch sử thanh toán';
        this.loadingList = false;
      },
    });
  }

  /** Mở modal chi tiết */
  viewDetail(id: number): void {
    this.loadingDetail = true;
    this.errorDetail = '';
    this.selected = null;

    this.api.get(id).subscribe({
      next: (data) => {
        this.selected = data;
        this.loadingDetail = false;
        this.lockBodyScroll();
      },
      error: (err) => {
        const e = err as any;
        this.errorDetail = e?.error?.message || `Không lấy được chi tiết #${id}`;
        this.loadingDetail = false;
      },
    });
  }

  /** Đóng modal */
  closeDetail(): void {
    this.selected = null;
    this.unlockBodyScroll();
  }

  /** Đóng bằng phím ESC */
  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.selected) this.closeDetail();
  }

  private lockBodyScroll() {
    document?.body?.classList.add('overflow-hidden');
  }
  private unlockBodyScroll() {
    document?.body?.classList.remove('overflow-hidden');
  }

  statusClass(status?: PaymentStatus): string {
    const base = 'px-2 py-1 rounded text-xs';
    switch (status) {
      case 'PAID': return `${base} bg-green-100 text-green-700`;
      case 'PENDING': return `${base} bg-amber-100 text-amber-700`;
      case 'FAILED': return `${base} bg-rose-100 text-rose-700`;
      case 'REFUNDED': return `${base} bg-blue-100 text-blue-700`;
      case 'CANCELLED': return `${base} bg-gray-100 text-gray-700`;
      default: return `${base} bg-gray-100 text-gray-700`;
    }
  }
}
