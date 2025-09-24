import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order } from '../../../shared/models/order.model';
import { OrderApiService } from '../../../core/services/order-api.service';

type UserStat = { count: number; totalAmount: number };

@Component({
  standalone: true,
  selector: 'app-admin-orders',
  imports: [CommonModule],
  templateUrl: './admin-orders.component.html'
})
export class AdminOrdersComponent implements OnInit {
  private api = inject(OrderApiService);

  orders: Order[] = [];
  selected: Order | null = null;

  loadingList = false;
  loadingDetail = false;
  errorMsg = '';

  // modal
  showModal = false;

  // Thống kê: userId -> {count, totalAmount}
  userStats = new Map<number, UserStat>();

  ngOnInit() { this.load(); }

  trackByOrderId = (_: number, o: Order) => o?.id;

  load() {
    this.loadingList = true;
    this.errorMsg = '';
    this.api.list().subscribe({
      next: (data) => {
        // để nguyên dữ liệu BE trả; nếu list không có items thì totalQty sẽ hiển thị "—"
        this.orders = data ?? [];
        this.buildUserStats();
        this.loadingList = false;
      },
      error: (err) => {
        this.errorMsg = err?.message || 'Không tải được danh sách đơn hàng';
        this.loadingList = false;
      }
    });
  }

  openDetail(o: Order) {
    if (!o?.id) return;
    this.selected = null;
    this.showModal = true;
    this.loadingDetail = true;
    this.api.get(o.id).subscribe({
      next: (full) => {
        full.items = full.items ?? [];
        this.selected = full;
        this.loadingDetail = false;
      },
      error: () => {
        this.loadingDetail = false;
      }
    });
  }

  closeDetail() {
    this.showModal = false;
    this.selected = null;
  }

  // ===== helpers =====
  /** Tổng SL: ưu tiên dùng field tóm tắt nếu BE có (itemsTotalQuantity),
   *  nếu không có thì tính từ items; nếu list không có items -> trả null để template hiển thị '—'
   */
  totalQty(o: Order): number | null {
    const anyO: any = o as any;
    if (typeof anyO.itemsTotalQuantity === 'number') return anyO.itemsTotalQuantity;
    const items = (anyO.items ?? []) as any[];
    if (!items.length) return null; // không có dữ liệu ở list
    return items.reduce((s, it) => s + (Number(it?.quantity) || 0), 0);
  }

  moneyStrToNum(v?: string | number | null) {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return isNaN(v) ? 0 : v;
    const n = Number(String(v).replace(/[, ]/g, ''));
    return isNaN(n) ? 0 : n;
  }

private buildUserStats() {
  this.userStats.clear();
  for (const o of this.orders) {
    const uid = o.userId;   // 👈 thay vì o.user?.id
    if (uid === null || uid === undefined) continue;
    const cur = this.userStats.get(uid) ?? { count: 0, totalAmount: 0 };
    cur.count += 1;
    cur.totalAmount += this.moneyStrToNum(o.totalAmount);
    this.userStats.set(uid, cur);
  }
}


  statusClass(s?: string | null) {
    switch (s) {
      case 'NEW': return 'bg-blue-100 text-blue-700';
      case 'PENDING_PAYMENT': return 'bg-amber-100 text-amber-800';
      case 'PAID': return 'bg-emerald-100 text-emerald-700';
      case 'SHIPPED': return 'bg-indigo-100 text-indigo-700';
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'CANCELLED': return 'bg-rose-100 text-rose-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}
