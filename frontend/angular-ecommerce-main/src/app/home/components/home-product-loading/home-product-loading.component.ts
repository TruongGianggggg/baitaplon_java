import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-home-product-loading',
  imports: [CommonModule],
  template: `
    <div class="grid gap-6 grid-cols-2 md:grid-cols-4">
      <div *ngFor="let i of [0,1,2,3,4,5,6,7,8,9,10,11]" class="border rounded-lg p-4 bg-white animate-pulse">
        <div class="h-32 w-full bg-slate-200 rounded mb-3"></div>
        <div class="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
        <div class="h-3 bg-slate-200 rounded w-1/2"></div>
      </div>
    </div>
  `
})
export class HomeProductLoadingComponent {}
