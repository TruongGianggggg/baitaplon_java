import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ProductApiService } from '../../../core/services/product-api.service';
import { CategoryApiService } from '../../../core/services/category-api.service';
import { environment } from '../../../../environments/environment';

import { PageResponse } from '../../../shared/models/page-response.model';
import { Product } from '../../../shared/models/product';
import { Category } from '../../../shared/models/category';

@Component({
  standalone: true,
  selector: 'app-admin-products',
  imports: [CommonModule, NgIf, NgFor, FormsModule, RouterLink],
  templateUrl: './admin-products.component.html',
})
export class AdminProductsComponent implements OnInit {
  private api = inject(ProductApiService);
  private catApi = inject(CategoryApiService);

  data: Product[] = [];
  categories: Category[] = [];

  keyword = '';
  categoryId?: number;
  enabled?: boolean;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;

  page = 0;
  size = 10;
  sort: string = 'id,desc';

  totalElements = 0;
  totalPages = 0;
  loading = false;
  error = '';

  // Toast
  TOAST_DURATION = 2500;
  toastVisible = false;
  toastType: 'success'|'error'|'info' = 'info';
  toastMsg = '';
  toastTimer: any;

  // Modal xoá
  showDeleteModal = false;
  deletingId: number | null = null;
  deletingLoading = false;

  ngOnInit() {
    this.loadCategories();
    this.load();
  }

  loadCategories() {
    this.catApi.listAll().subscribe({
      next: (list) => (this.categories = list ?? []),
      error: () => (this.categories = []),
    });
  }

  load() {
    this.loading = true;
    this.error = '';
    this.api
      .search({
        keyword: this.keyword || undefined,
        categoryId: this.categoryId,
        enabled: this.enabled,
        minPrice: this.minPrice,
        maxPrice: this.maxPrice,
        inStock: this.inStock,
        page: this.page,
        size: this.size,
        sort: this.sort,
      })
      .subscribe({
        next: (res: PageResponse<Product>) => {
          this.data = res?.content ?? [];
          this.totalElements = res?.totalElements ?? this.data.length;
          this.totalPages = res?.totalPages ?? 1;
        },
        error: (err) => {
          console.error('Load products error', err);
          this.error = 'Không thể tải danh sách sản phẩm.';
          this.data = [];
          this.totalElements = 0;
          this.totalPages = 0;
        },
        complete: () => (this.loading = false),
      });
  }

  searchNow() { this.page = 0; this.load(); }

  clearFilters() {
    this.keyword = '';
    this.categoryId = undefined;
    this.enabled = undefined;
    this.inStock = undefined;
    this.minPrice = undefined;
    this.maxPrice = undefined;
    this.page = 0;
    this.sort = 'id,desc';
    this.load();
  }

  changeSort(field: 'id' | 'name' | 'price' | 'stock' | 'createdAt' | 'updatedAt') {
    const [cur, dir] = (this.sort || 'id,desc').split(',') as [string, 'asc' | 'desc'];
    const nextDir: 'asc' | 'desc' = cur === field && dir === 'asc' ? 'desc' : 'asc';
    this.sort = `${field},${nextDir}`;
    this.page = 0;
    this.load();
  }

  gotoPage(p: number) {
    if (p < 0 || p >= this.totalPages) return;
    this.page = p;
    this.load();
  }

  // --- modal xoá ---
  openDeleteModal(id: number) {
    this.deletingId = id;
    this.showDeleteModal = true;
    this.deletingLoading = false;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.deletingId = null;
    this.deletingLoading = false;
  }

  confirmDelete() {
    if (!this.deletingId) return;
    this.deletingLoading = true;
    this.api.delete(this.deletingId).subscribe({
      next: () => {
        this.showToast('success', 'Đã xoá sản phẩm');
        this.load();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Xoá sản phẩm thất bại';
        this.showToast('error', msg);
      },
      complete: () => this.closeDeleteModal()
    });
  }

  trackById = (_: number, p: Product) => p?.id ?? _;

  fmtMoney(v?: number, cur?: string) {
    if (v == null) return '';
    try { return new Intl.NumberFormat('vi-VN').format(v) + ' ' + (cur || 'VND'); }
    catch { return `${v} ${cur ?? ''}`.trim(); }
  }

  fmtDate(d?: string) { return d ? new Date(d).toLocaleString('vi-VN') : ''; }

  getImageUrl(path?: string | null): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const origin = new URL(environment.apiUrl).origin;
    return `${origin}/${path.replace(/^\/+/, '')}`;
  }

  percentOff(p?: Product): string {
    if (!p?.previousPrice || p.previousPrice <= 0 || p.price == null) return '';
    const off = (1 - p.price / p.previousPrice) * 100;
    if (!isFinite(off) || off <= 0) return '';
    return `${off.toFixed(0)}%`;
  }

  detailsCount(p?: Product): number {
    return p?.detailImages?.length ?? 0;
  }

  // --- mini toast ---
  showToast(type: 'success'|'error'|'info', msg: string) {
    this.toastType = type;
    this.toastMsg = msg;
    this.toastVisible = true;      // chỉ lúc này mới render -> không có chấm đen
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastVisible = false, this.TOAST_DURATION);
  }
}
