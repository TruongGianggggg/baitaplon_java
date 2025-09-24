import { Component, input, OnInit, output } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { CartProduct } from '../../../shared/models/cart-product';

@Component({
  standalone: true,
  selector: 'app-cart-product',
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './cart-product.component.html',
})
export class CartProductComponent implements OnInit {
  cartProduct = input.required<CartProduct>();
  total = 0;

  updateCartEvent = output<void>();

  ngOnInit(): void { this.updateTotal(); }

  updateQantity(num: number) {
    const cp = this.cartProduct();
    let result = (cp.quantity ?? 1) + num;
    if (result <= 0) result = 1;
    cp.quantity = result;

    this.updateTotal();
    this.updateCart();
    this.updateCartEvent.emit();
  }

  removeProduct() {
    const raw = localStorage.getItem('cart-products');
    const cartProducts: CartProduct[] = raw ? JSON.parse(raw) : [];
    const filtered = cartProducts.filter(({ product }) => product.id !== this.cartProduct().product.id);
    localStorage.setItem('cart-products', JSON.stringify(filtered));
    this.updateCartEvent.emit();
  }

  private updateTotal() {
    const cp = this.cartProduct();
    this.total = ((cp.product.price ?? 0) * (cp.quantity ?? 1));
  }

  private updateCart() {
    const raw = localStorage.getItem('cart-products');
    const cartProducts: CartProduct[] = raw ? JSON.parse(raw) : [];
    const filtered = cartProducts.filter(({ product }) => product.id !== this.cartProduct().product.id);
    const updated = [...filtered, this.cartProduct()];
    localStorage.setItem('cart-products', JSON.stringify(updated));
  }
}
