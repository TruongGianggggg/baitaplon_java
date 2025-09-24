import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { ProductApiService } from '../core/services/product-api.service';
import { CategoryApiService } from '../core/services/category-api.service';

import { HomeProductComponent } from './components/home-product/home-product.component';
import { HomeProductLoadingComponent } from './components/home-product-loading/home-product-loading.component';

import { Product } from '../shared/models/product';
import { Category } from '../shared/models/category';
import { PageResponse } from '../shared/models/page-response.model';

@Component({
  standalone: true,
  selector: 'app-category-products',
  imports: [CommonModule, NgIf, NgFor, HomeProductComponent, HomeProductLoadingComponent],
  templateUrl: './category-products.component.html',
})
export class CategoryProductsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productApi = inject(ProductApiService);
  private catApi = inject(CategoryApiService);

  catId!: number | 'all';
  category?: Category;
  loading = true;

  page = 0;
  size = 12;
  sort = 'createdAt,desc';
  totalPages = 0;
  items: Product[] = [];

  ngOnInit() {
    const raw = this.route.snapshot.paramMap.get('id');
    this.catId = (raw === 'all') ? 'all' : Number(raw);

    if (this.catId !== 'all') {
      this.catApi.get(Number(this.catId)).subscribe({
        next: c => this.category = c,
        error: () => this.category = undefined
      });
    }
    this.load();
  }

  load() {
    this.loading = true;
    this.productApi.search({
      categoryId: this.catId === 'all' ? undefined : Number(this.catId),
      page: this.page, size: this.size, sort: this.sort, enabled: true
    }).subscribe({
      next: (res: PageResponse<Product>) => {
        this.items = res?.content ?? [];
        this.totalPages = res?.totalPages ?? 1;
      },
      error: () => {
        this.items = [];
        this.totalPages = 0;
      },
      complete: () => this.loading = false
    });
  }

  goto(p: number) {
    if (p < 0 || p >= this.totalPages) return;
    this.page = p;
    this.load();
  }

  trackById = (_: number, p: Product) => p.id!;
}
