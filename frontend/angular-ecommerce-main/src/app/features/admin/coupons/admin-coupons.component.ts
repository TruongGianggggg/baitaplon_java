import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { CouponApiService } from '../../../core/services/coupon-api.service';
import { Coupon, DiscountType, TargetType } from '../../../shared/models/coupon.model';

@Component({
  standalone: true,
  selector: 'app-admin-coupons',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-coupons.component.html'
})
export class AdminCouponsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(CouponApiService);

  loading = false;
  coupons: Coupon[] = [];
  editing: Coupon | null = null;
  showForm = false;
  q = '';

  fm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(64)]],
    name: [''],
    description: [''],

    discountType: ['PERCENT' as DiscountType, Validators.required],
    discountValue: ['0', [Validators.required]],

    maxDiscountAmount: [null as string | null],
    minOrderAmount: [null as string | null],

    targetType: ['ALL' as TargetType, Validators.required],
    enabled: [true],
    stackable: [false],

    startsAt: [''],
    endsAt: [''],

    totalQuantity: [null as number | null],
    perUserLimit: [null as number | null],
  });

  ngOnInit() { this.load(); }

  get filtered(): Coupon[] {
    const t = this.q.trim().toLowerCase();
    return t
      ? this.coupons.filter(c =>
          (c.code || '').toLowerCase().includes(t) ||
          (c.name || '').toLowerCase().includes(t))
      : this.coupons;
  }

  trackByCouponId = (_: number, item: Coupon) => item.id as number;

  load() {
    this.loading = true;
    this.api.list().subscribe({
      next: (d) => { this.coupons = d; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  newCoupon() {
    this.editing = null;
    this.showForm = true;
    this.fm.reset({
      code: '', name: '', description: '',
      discountType: 'PERCENT', discountValue: '0',
      maxDiscountAmount: null, minOrderAmount: null,
      targetType: 'ALL', enabled: true, stackable: false,
      startsAt: '', endsAt: '',
      totalQuantity: null, perUserLimit: null,
    });
  }

  edit(c: Coupon) {
    this.editing = c;
    this.showForm = true;
    this.fm.patchValue({
      code: c.code,
      name: c.name ?? '',
      description: c.description ?? '',

      discountType: c.discountType,
      discountValue: c.discountValue ?? '0',

      maxDiscountAmount: c.maxDiscountAmount ?? null,
      minOrderAmount: c.minOrderAmount ?? null,

      targetType: c.targetType,
      enabled: !!c.enabled,
      stackable: !!c.stackable,

      startsAt: c.startsAt ? c.startsAt.substring(0, 16) : '',
      endsAt:   c.endsAt   ? c.endsAt.substring(0, 16)   : '',

      totalQuantity: c.totalQuantity ?? null,
      perUserLimit: c.perUserLimit ?? null,
    });
  }

  cancel() {
    this.showForm = false;
    this.editing = null;
  }

  remove(c: Coupon) {
    if (!c.id) return;
    if (!confirm(`Xoá mã "${c.code}"?`)) return;
    this.api.delete(c.id).subscribe(() => this.load());
  }

  private toStrOrUndefined(v: unknown): string | undefined {
    if (v === null || v === undefined || v === '') return undefined;
    return String(v);
  }
  private toBool(v: unknown): boolean {
    return v === true || v === 'true';
  }

  save() {
    if (this.fm.invalid) {
      this.fm.markAllAsTouched();
      return;
    }

    const v = this.fm.getRawValue();

    const payload: Coupon = {
      code: v.code,
      name: v.name?.trim() || undefined,
      description: v.description?.trim() || undefined,

      discountType: v.discountType as DiscountType,
      discountValue: String(v.discountValue ?? '0'),

      maxDiscountAmount: this.toStrOrUndefined(v.maxDiscountAmount),
      minOrderAmount: this.toStrOrUndefined(v.minOrderAmount),

      targetType: v.targetType as TargetType,
      enabled: this.toBool(v.enabled),
      stackable: this.toBool(v.stackable),

      totalQuantity: v.totalQuantity ?? undefined,
      perUserLimit: v.perUserLimit ?? undefined,

      startsAt: v.startsAt ? new Date(v.startsAt).toISOString() : null,
      endsAt:   v.endsAt   ? new Date(v.endsAt).toISOString()   : null,
    };

    const req$ = this.editing?.id
      ? this.api.update(this.editing.id, payload)
      : this.api.create(payload);

    this.loading = true;
    req$.subscribe({
      next: () => {
        this.loading = false;
        this.showForm = false;
        this.editing = null;
        this.load();
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.message || err?.message || 'Tạo/cập nhật coupon thất bại';
        alert(msg);
        console.error('Coupon save error:', err);
      }
    });
  }
}
