import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-admin-orders',
  imports: [CommonModule],
  template: `
    <h2 class="text-xl font-semibold mb-4">Orders</h2>
    <p class="text-gray-600">Danh sách đơn hàng (nối API sau).</p>
  `,
})
export class AdminOrdersComponent {}
