import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ProductApiService } from '../../../core/services/product-api.service';
import { CategoryApiService } from '../../../core/services/category-api.service';
import { Category } from '../../../shared/models/category';

@Component({
  standalone: true,
  selector: 'app-admin-product-form',
  imports: [CommonModule, ReactiveFormsModule, NgIf, NgFor],
  templateUrl: './admin-product-form.component.html',
})
export class AdminProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ProductApiService);
  private catApi = inject(CategoryApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isEdit = false;
  id: number | null = null;

  cover: File | null = null;
  details: File[] = [];

  categories: Category[] = [];
  loadingCats = false;

  // UI state / messages
  submitting = false;
  successMsg = '';
  errorMsg = '';

  // Toast (slide-in, không flicker)
  TOAST_DURATION = 2500;
  toastVisible = false;
  toastType: 'success'|'error'|'info' = 'info';
  toastMsg = '';
  toastTimer: any;

  fm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: ['', Validators.required],
    sku: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    description: [''],
    categoryId: [0, [Validators.required, Validators.min(1)]],
    enabled: [true, Validators.required],
    stock: [0, [Validators.required, Validators.min(0)]],
    currency: ['VND', [Validators.required, Validators.minLength(3)]],
  });

  ngOnInit() {
    this.loadCategories();

    const raw = this.route.snapshot.paramMap.get('id');
    if (raw) {
      this.isEdit = true;
      this.id = +raw;
      this.api.get(this.id).subscribe({
        next: (p) => {
          this.fm.patchValue({
            name: p.name,
            slug: p.slug,
            sku: p.sku,
            price: p.price,
            description: p.description ?? '',
            categoryId: p.category?.id ?? 0,
            enabled: p.enabled,
            stock: p.stock,
            currency: p.currency || 'VND',
          });
        },
        error: (err) => {
          this.errorMsg = this.pickErrMsg(err, 'Không tải được sản phẩm.');
          this.showToast('error', this.errorMsg);
        }
      });
    }
  }

  loadCategories() {
    this.loadingCats = true;
    this.catApi.listAll().subscribe({
      next: (list) => this.categories = (list ?? []).sort((a,b) => a.name.localeCompare(b.name)),
      error: () => this.categories = [],
      complete: () => this.loadingCats = false
    });
  }

  onCover(e: Event) {
    this.cover = (e.target as HTMLInputElement).files?.[0] ?? null;
  }

  onDetails(e: Event) {
    const fs = (e.target as HTMLInputElement).files;
    this.details = fs ? Array.from(fs) : [];
  }

  submit() {
    this.successMsg = '';
    this.errorMsg = '';

    if (this.fm.invalid) {
      this.fm.markAllAsTouched();
      this.errorMsg = 'Vui lòng kiểm tra các trường bắt buộc.';
      this.showToast('error', this.errorMsg);
      return;
    }

    const v = this.fm.getRawValue();

    if (!v.categoryId || v.categoryId < 1) {
      this.errorMsg = 'Vui lòng chọn danh mục.';
      this.showToast('error', this.errorMsg);
      return;
    }

    const fd = new FormData();
    fd.set('name', v.name);
    fd.set('slug', v.slug);
    fd.set('sku', v.sku);
    if (v.description) fd.set('description', v.description);
    fd.set('price', String(v.price));
    fd.set('currency', v.currency);
    fd.set('stock', String(v.stock));
    fd.set('enabled', String(v.enabled));
    fd.set('categoryId', String(v.categoryId));

    if (this.cover) fd.append('cover', this.cover);
    if (this.details?.length) this.details.forEach((f) => fd.append('details', f));

    this.submitting = true;

    const redirect = () => this.router.navigate(['/admin/products']);

    if (this.isEdit && this.id) {
      this.api.update(this.id, fd).subscribe({
        next: () => {
          this.successMsg = 'Cập nhật sản phẩm thành công.';
          this.showToast('success', this.successMsg);
          setTimeout(redirect, 500);
        },
        error: (err) => {
          this.errorMsg = this.pickErrMsg(err, 'Cập nhật sản phẩm thất bại.');
          this.showToast('error', this.errorMsg);
          this.submitting = false;
          try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
        }
      });
    } else {
      this.api.create(fd).subscribe({
        next: () => {
          this.successMsg = 'Tạo sản phẩm thành công.';
          this.showToast('success', this.successMsg);
          setTimeout(redirect, 500);
        },
        error: (err) => {
          this.errorMsg = this.pickErrMsg(err, 'Tạo sản phẩm thất bại.');
          this.showToast('error', this.errorMsg);
          this.submitting = false;
          try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
        }
      });
    }
  }

  private pickErrMsg(err: any, fallback: string): string {
    return err?.error?.message || err?.error?.error || err?.message || fallback;
  }

  // --- mini toast (slide-in) — render chỉ khi visible để không bị "chấm đen"
  showToast(type: 'success'|'error'|'info', msg: string) {
    this.toastType = type;
    this.toastMsg = msg;
    this.toastVisible = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastVisible = false, this.TOAST_DURATION);
  }
}
