import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  ChartConfiguration,
  ChartData,
  registerables,
} from 'chart.js';

// ✅ Đăng ký tất cả để tránh lỗi missing controller/scale/element
Chart.register(...registerables);

import { Order } from '../../../shared/models/order.model';
import { Payment } from '../../../shared/models/payment';
import { OrderApiService } from '../../../core/services/order-api.service';
import { PaymentService } from '../../../core/services/payment.service';

type PeriodKey = '7d' | '30d' | '90d' | '12m';

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  imports: [CommonModule, RouterModule, BaseChartDirective],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  private orderApi = inject(OrderApiService);
  private paymentApi = inject(PaymentService);

  // Raw data
  orders: Order[] = [];
  payments: Payment[] = [];

  // Summary
  revenue = 0;
  ordersToday = 0;
  customersActiveWeek = 0;
  cancellations30d = 0;

  // Tables
  recentOrders: Order[] = [];
  recentPayments: Payment[] = [];

  // ====== Chart state (Sales Overview) ======
  period: PeriodKey = '7d'; // mặc định 7 ngày
  chartData: ChartData<'bar' | 'line'> = {
    labels: [],
    datasets: [],
  };

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: {
        grid: { color: 'rgba(0,0,0,0.06)' },
        ticks: { color: '#6b7280' },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.06)' },
        ticks: {
          color: '#6b7280',
          // rút gọn số tiền cho dễ nhìn
          callback: (v) => {
            const n = Number(v);
            if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
            if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
            if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k';
            return n.toString();
          },
        },
      },
    },
  };

  // ====== Payment Summary (Doughnut) ======
  paymentBreakdownMode: 'count' | 'amount' = 'count';

  paymentSummaryData: ChartData<'doughnut'> = {
    labels: ['PAID', 'PENDING', 'CANCELLED', 'FAILED'],
    datasets: [
      {
        data: [0, 0, 0, 0],
        backgroundColor: [
          'rgba(16,185,129,0.75)',  // emerald-500
          'rgba(245,158,11,0.75)',  // amber-500
          'rgba(107,114,128,0.65)', // gray-500
          'rgba(239,68,68,0.75)',   // red-500
        ],
        borderColor: [
          'rgba(16,185,129,1)',
          'rgba(245,158,11,1)',
          'rgba(107,114,128,1)',
          'rgba(239,68,68,1)',
        ],
        borderWidth: 1,
        hoverOffset: 6,
      },
    ],
  };

  paymentSummaryOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const label = ctx.label || '';
            const val = (ctx.parsed as number) || 0;
            if (this.paymentBreakdownMode === 'amount') {
              return `${label}: ${new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                maximumFractionDigits: 0,
              }).format(val)}`;
            }
            return `${label}: ${val}`;
          },
        },
      },
    },
  };

  ngOnInit(): void {
    this.loadData();
  }

  // ====== Load & build summaries ======
  private loadData() {
    this.orderApi.list().subscribe((orders) => {
      this.orders = orders ?? [];
      this.buildFromOrders();
    });

    this.paymentApi.list().subscribe((payments) => {
      this.payments = payments ?? [];
      this.buildFromPayments();
      this.rebuildChart();             // build Sales Overview
      this.buildPaymentSummaryChart(); // build Doughnut Summary
    });
  }

  private buildFromOrders() {
    const todayStr = new Date().toISOString().slice(0, 10);

    this.ordersToday = this.orders.filter((o) =>
      (o.createdAt ?? '').startsWith(todayStr)
    ).length;

    const weekAgo = this.addDays(new Date(), -7);
    const activeUsers = new Set(
      this.orders
        .filter((o) => o.createdAt && new Date(o.createdAt) >= weekAgo)
        .map((o) => o.userId)
    );
    this.customersActiveWeek = activeUsers.size;

    this.recentOrders = [...this.orders]
      .filter((o) => !!o.createdAt)
      .sort(
        (a, b) =>
          +new Date(b.createdAt as string) - +new Date(a.createdAt as string)
      )
      .slice(0, 10);
  }

  private buildFromPayments() {
    const thirtyAgo = this.addDays(new Date(), -30);

    this.revenue = this.payments
      .filter((p) => (p.status || '').toUpperCase() === 'PAID')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    this.cancellations30d = this.payments.filter(
      (p) =>
        (p.status || '').toUpperCase() === 'CANCELLED' &&
        p.createdAt &&
        new Date(p.createdAt) >= thirtyAgo
    ).length;

    this.recentPayments = [...this.payments]
      .filter((p) => !!p.createdAt)
      .sort(
        (a, b) =>
          +new Date(b.createdAt as string) - +new Date(a.createdAt as string)
      )
      .slice(0, 10);
  }

  // ====== Chart build logic (Sales Overview) ======
  setPeriod(p: PeriodKey) {
    if (this.period !== p) {
      this.period = p;
      this.rebuildChart();
    }
  }

  private rebuildChart() {
    const paid = this.payments.filter(
      (p) => (p.status || '').toUpperCase() === 'PAID'
    );

    if (this.period === '12m') {
      // 12 tháng gần nhất: gom theo YYYY-MM
      const { labels, values } = this.groupByMonth(paid, 12);
      this.chartData = {
        labels,
        datasets: [
          {
            type: 'bar',
            label: 'Revenue (PAID)',
            data: values,
            borderWidth: 1,
            borderColor: 'rgba(59,130,246,1)', // blue-500
            backgroundColor: 'rgba(59,130,246,0.35)',
            hoverBackgroundColor: 'rgba(59,130,246,0.55)',
          },
          {
            type: 'line',
            label: 'Trend',
            data: this.calcSMA(values, 3),
            borderColor: 'rgba(16,185,129,1)', // emerald-500
            pointRadius: 2,
            borderWidth: 2,
            fill: false,
            tension: 0.25,
          },
        ],
      };
      return;
    }

    // 7/30/90 ngày: gom theo ngày
    const days = this.period === '7d' ? 7 : this.period === '30d' ? 30 : 90;
    const { labels, values } = this.groupByDay(paid, days);

    this.chartData = {
      labels,
      datasets: [
        {
          type: 'bar',
          label: 'Revenue (PAID)',
          data: values,
          borderWidth: 1,
          borderColor: 'rgba(99,102,241,1)', // indigo-500
          backgroundColor: 'rgba(99,102,241,0.35)',
          hoverBackgroundColor: 'rgba(99,102,241,0.55)',
        },
        {
          type: 'line',
          label: '7d Avg',
          data: this.movingAverage(values, 7),
          borderColor: 'rgba(245,158,11,1)', // amber-500
          pointRadius: 0,
          borderWidth: 2,
          fill: false,
          tension: 0.25,
        },
      ],
    };
  }

  // ====== Payment Summary (Doughnut) logic ======
  setPaymentMode(mode: 'count' | 'amount') {
    if (this.paymentBreakdownMode !== mode) {
      this.paymentBreakdownMode = mode;
      this.buildPaymentSummaryChart();
    }
  }

  private buildPaymentSummaryChart() {
    // Gom payment theo trạng thái
    const groups = {
      PAID: { count: 0, amount: 0 },
      PENDING: { count: 0, amount: 0 },
      CANCELLED: { count: 0, amount: 0 },
      FAILED: { count: 0, amount: 0 },
    } as Record<'PAID' | 'PENDING' | 'CANCELLED' | 'FAILED', { count: number; amount: number }>;

    for (const p of this.payments) {
      const st = (p.status || '').toUpperCase();
      const key = (['PAID', 'PENDING', 'CANCELLED', 'FAILED'] as const).includes(st as any)
        ? (st as 'PAID' | 'PENDING' | 'CANCELLED' | 'FAILED')
        : 'FAILED';
      groups[key].count += 1;
      groups[key].amount += p.amount || 0;
    }

    const data =
      this.paymentBreakdownMode === 'count'
        ? [groups.PAID.count, groups.PENDING.count, groups.CANCELLED.count, groups.FAILED.count]
        : [groups.PAID.amount, groups.PENDING.amount, groups.CANCELLED.amount, groups.FAILED.amount];

    this.paymentSummaryData = {
      ...this.paymentSummaryData,
      datasets: [{ ...(this.paymentSummaryData.datasets[0] as any), data }],
    };
  }

  // ====== Helpers: grouping & math ======
  private yyyyMmDd(d: Date) {
    return d.toISOString().slice(0, 10);
  }
  private addDays(d: Date, days: number) {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
  }
  private startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }
  private addMonths(d: Date, m: number) {
    return new Date(d.getFullYear(), d.getMonth() + m, 1);
  }
  private monthLabel(d: Date) {
    // mm/yyyy ngắn gọn
    return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }

  private groupByDay(paid: Payment[], days: number) {
    const today = new Date();
    const start = this.addDays(today, -days + 1);

    const labels: string[] = [];
    const map = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = this.addDays(start, i);
      const k = this.yyyyMmDd(d);
      labels.push(k.slice(5)); // MM-DD
      map.set(k, 0);
    }

    for (const p of paid) {
      const created = p.createdAt || (p as any)?.order?.createdAt;
      if (!created) continue;
      const k = this.yyyyMmDd(new Date(created));
      if (k >= this.yyyyMmDd(start) && k <= this.yyyyMmDd(today)) {
        map.set(k, (map.get(k) || 0) + (p.amount || 0));
      }
    }

    const values = Array.from(map.values());
    return { labels, values };
  }

  private groupByMonth(paid: Payment[], months: number) {
    const end = this.startOfMonth(new Date()); // đầu tháng hiện tại
    const start = this.addMonths(end, -(months - 1)); // lùi N-1 tháng

    const labels: string[] = [];
    const keys: string[] = [];
    const map = new Map<string, number>();

    for (let i = 0; i < months; i++) {
      const m = this.addMonths(start, i);
      const key = `${m.getFullYear()}-${(m.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;
      keys.push(key);
      labels.push(this.monthLabel(m));
      map.set(key, 0);
    }

    for (const p of paid) {
      const created = p.createdAt || (p as any)?.order?.createdAt;
      if (!created) continue;
      const d = new Date(created);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;
      if (map.has(key)) map.set(key, (map.get(key) || 0) + (p.amount || 0));
    }

    const values = keys.map((k) => map.get(k) || 0);
    return { labels, values };
  }

  private movingAverage(arr: number[], window = 7) {
    const out: number[] = [];
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      sum += arr[i];
      if (i >= window) sum -= arr[i - window];
      out.push(i >= window - 1 ? Math.round(sum / window) : 0);
    }
    return out;
  }

  private calcSMA(arr: number[], window = 3) {
    return this.movingAverage(arr, window);
  }

  // ====== UI helpers ======
  statusBadgeClass(st?: string): string {
    switch ((st || '').toUpperCase()) {
      case 'PAID':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'FAILED':
        return 'bg-rose-100 text-rose-700';
      case 'CANCELLED':
        return 'bg-gray-200 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }
}
