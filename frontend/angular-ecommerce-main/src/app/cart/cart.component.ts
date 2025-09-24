import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Router } from '@angular/router';                // ✅ thêm import Router
import { CartApiService } from '../core/services/cart-api.service';
import { Cart, CartItem } from '../shared/models/cart-product';

@Component({
  standalone: true,
  selector: 'app-cart',
  imports: [CommonModule, NgFor, NgIf],
  templateUrl: './cart.component.html',
})
export class CartComponent implements OnInit {
  private cartApi = inject(CartApiService);
  private router = inject(Router);

  cart: Cart | null = null;

  ngOnInit() { this.load(); }

  load() {
    this.cartApi.getCart().subscribe(c => this.cart = c);
  }

  onQtyChange(productId: number, ev: Event) {
    const v = Number((ev.target as HTMLInputElement)?.value);
    const q = Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
    this.cartApi.update(productId, q).subscribe(() => this.load());
  }

  onQtyInput(it: CartItem, ev: Event) {
    const v = Number((ev.target as HTMLInputElement)?.value);
    const q = Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
    if (q === it.quantity) return;
    this.cartApi.update(it.product.id, q).subscribe(() => this.load());
  }

  remove(itOrId: CartItem | number) {
    const productId = typeof itOrId === 'number' ? itOrId : itOrId.product.id;
    this.cartApi.remove(productId).subscribe(() => this.load());
  }

  clear() {
    this.cartApi.clear().subscribe(() => this.load());
  }

  total(): number {
    return this.cart?.totalAmount ?? 0;
  }

  // hàm điều hướng sang trang checkout
  goCheckout() {
    if (this.cart && this.cart.items.length > 0) {
      this.router.navigate(['/checkout']);
    }
  }
}
