import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product';

@Component({
  selector: 'app-product-offer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-offer.component.html'
})
export class ProductOfferComponent {
  @Input({ required: true }) product!: Product;
}
