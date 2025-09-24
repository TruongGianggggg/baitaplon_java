// src/app/home/components/home-product/home-product.component.ts
import { Component, Input, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartApiService } from '../../../core/services/cart-api.service';
import { environment } from '../../../../environments/environment';
import { Product } from '../../../shared/models/product';

@Component({
  standalone: true,
  selector: 'app-home-product',
  imports: [CommonModule, CurrencyPipe, RouterLink], // <= thêm RouterLink
  templateUrl: './home-product.component.html',
})
export class HomeProductComponent {
  private cartApi = inject(CartApiService);

  @Input({ required: true }) product!: Product;

  /** Lấy origin từ environment.apiUrl (vd 'http://localhost:8080/api' -> 'http://localhost:8080') */
  private getApiOrigin(): string {
    const api = environment.apiUrl ?? '';
    try {
      return new URL(api).origin;
    } catch {
      const m = api.match(/^https?:\/\/[^/]+/i);
      return m ? m[0] : '';
    }
  }

  /** Placeholder nội bộ (data URI) để không còn gọi /assets */
  private readonly placeholder =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480">
         <rect width="100%" height="100%" fill="#f1f5f9"/>
         <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
               font-family="Inter,Arial" font-size="18" fill="#94a3b8">No image</text>
       </svg>`
    );

  /** Build src ảnh từ coverImage / detailImages[0]; hỗ trợ cả relative và absolute */
  imageSrc(): string {
    const raw = this.product.coverImage || this.product.detailImages?.[0] || '';
    if (!raw) return this.placeholder;

    // absolute (http/https/data)
    if (/^(https?:|data:)/i.test(raw)) return raw;

    // relative (/uploads/xxx.jpg)
    const origin = this.getApiOrigin();
    const path = raw.startsWith('/') ? raw : `/${raw}`;
    return `${origin}${path}`;
  }

  onImgError(ev: Event) {
    (ev.target as HTMLImageElement).src = this.placeholder;
  }

  addToCart() {
    if (!this.product?.id) return;
    this.cartApi.add(this.product.id, 1).subscribe(() => {
      alert(`Đã thêm "${this.product.name}" vào giỏ`);
    });
  }
}
