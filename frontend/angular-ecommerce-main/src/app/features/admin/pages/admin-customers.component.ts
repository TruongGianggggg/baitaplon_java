import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-admin-customers',
  imports: [CommonModule],
  template: `
    <h2 class="text-xl font-semibold mb-4">Customers</h2>
    <p class="text-gray-600">Quản lý khách hàng (nối API sau).</p>
  `,
})
export class AdminCustomersComponent {}
