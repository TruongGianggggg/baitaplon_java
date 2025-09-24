import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-admin-settings',
  imports: [CommonModule],
  template: `
    <h2 class="text-xl font-semibold mb-4">Settings</h2>
    <p class="text-gray-600">Cấu hình hệ thống (nối API sau).</p>
  `,
})
export class AdminSettingsComponent {}
