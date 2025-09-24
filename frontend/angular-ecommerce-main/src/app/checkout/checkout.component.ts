import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderApiService } from '../core/services/order-api.service';
import { AuthService } from '../core/auth.service';
import { CheckoutRequest, CheckoutItemInput } from '../shared/models/order.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-checkout',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html'
})
export class CheckoutComponent implements OnInit {
  private fb = inject(FormBuilder);
  private orderApi = inject(OrderApiService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);

  private cartApiBase = `${environment.apiUrl}/api/cart`;

  loading = false;
  error = '';

  fm = this.fb.nonNullable.group({
    receiverName: ['', Validators.required],
    receiverPhone: ['', Validators.required],
    shipAddressLine1: ['', Validators.required],
    shipAddressLine2: [''],
    shipWard: [''],
    shipDistrict: [''],
    shipCity: [''],
    shipPostalCode: [''],
    shipCountry: ['VN', Validators.required],
    couponCode: [''],
    paymentMethod: ['COD' as 'COD' | 'VNPAY', Validators.required],
  });

  ngOnInit(): void {
    const u = this.auth.userProfile;
    if (u) {
      this.fm.patchValue({
        receiverName: u.fullName ?? '',
        receiverPhone: u.phone ?? '',
        shipAddressLine1: u.addressLine1 ?? '',
        shipAddressLine2: u.addressLine2 ?? '',
        shipWard: u.ward ?? '',
        shipDistrict: u.district ?? '',
        shipCity: u.city ?? '',
        shipPostalCode: u.postalCode ?? '',
        shipCountry: u.country ?? 'VN',
      });
    }
  }

  // ---------- CART HELPERS ----------

  /** heuristics: mảng object có {productId | product.id, quantity} */
  private looksLikeCartArray(val: any): boolean {
    if (!Array.isArray(val)) return false;
    return val.some((i: any) =>
      i && (i.productId != null || i?.product?.id != null || i.id != null || i.productID != null) &&
      (i.quantity != null || i.qty != null)
    );
  }

  /** Chuẩn hoá 1 phần tử về { productId, quantity } */
  private normalizeItem(i: any): CheckoutItemInput | null {
    const productId = Number(i.productId ?? i?.product?.id ?? i.id ?? i.productID);
    const quantity = Number(i.quantity ?? i.qty ?? 1);
    if (!Number.isFinite(productId) || quantity <= 0) return null;
    return { productId, quantity };
  }

  /** Đọc & quét toàn bộ storage để tìm cart (key không cố định) */
  private deepScanCartFromStorage(): CheckoutItemInput[] {
    const collect: CheckoutItemInput[] = [];

    const readAll = (storage: Storage) => {
      for (let idx = 0; idx < storage.length; idx++) {
        const key = storage.key(idx)!;
        const raw = storage.getItem(key);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);

          // TH1: mảng trực tiếp
          if (this.looksLikeCartArray(parsed)) {
            (parsed as any[]).forEach(i => {
              const n = this.normalizeItem(i);
              if (n) collect.push(n);
            });
            continue;
          }

          // TH2: bọc trong {items: []} / {list: []} / {cart: []}
          const candidateArrays = [parsed?.items, parsed?.list, parsed?.cart, parsed?.data];
          for (const arr of candidateArrays) {
            if (this.looksLikeCartArray(arr)) {
              (arr as any[]).forEach(i => {
                const n = this.normalizeItem(i);
                if (n) collect.push(n);
              });
              break;
            }
          }
        } catch {
          // not JSON, skip
        }
      }
    };

    readAll(localStorage);
    readAll(sessionStorage);

    // gộp item trùng productId (nếu có)
    const merged = new Map<number, number>();
    for (const it of collect) {
      merged.set(it.productId, (merged.get(it.productId) ?? 0) + it.quantity);
    }
    const result = [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity }));
    console.debug('[checkout] deepScanCartFromStorage:', result);
    return result;
  }

  /** Xoá mọi entry trông giống cart khỏi storage */
  private clearCartStorageDeep() {
    const clearFrom = (storage: Storage) => {
      const keysToRemove: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i)!;
        const raw = storage.getItem(key);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          if (this.looksLikeCartArray(parsed) ||
              this.looksLikeCartArray(parsed?.items) ||
              this.looksLikeCartArray(parsed?.list) ||
              this.looksLikeCartArray(parsed?.cart)) {
            keysToRemove.push(key);
          }
        } catch {
          // ignore
        }
      }
      keysToRemove.forEach(k => storage.removeItem(k));
    };
    clearFrom(localStorage);
    clearFrom(sessionStorage);
  }

  /** (Tuỳ chọn) gọi giỏ server-side, chỉ khi có token -> tránh 403 */
  private async fetchCartFromServerIfPossible(): Promise<CheckoutItemInput[]> {
    try {
      const token = (this.auth as any)?.token || (this.auth as any)?.accessToken;
      if (!token) return []; // không có token -> bỏ qua để tránh 403

      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      const cart: any = await firstValueFrom(
        this.http.get(this.cartApiBase, { headers, withCredentials: true })
      );

      const list = Array.isArray(cart?.items) ? cart.items : [];
      const items = list.map((ci: any) => this.normalizeItem({
        productId: ci?.product?.id ?? ci?.productId ?? ci?.id,
        quantity: ci?.quantity ?? 1
      })).filter(Boolean) as CheckoutItemInput[];

      console.debug('[checkout] server cart items:', items);
      return items;
    } catch (e) {
      console.warn('[checkout] fetch server cart failed:', e);
      return [];
    }
  }

  // ---------- SUBMIT ----------

  async submit() {
    if (this.fm.invalid) { this.fm.markAllAsTouched(); return; }
    this.loading = true;
    this.error = '';

    // 1) Lấy cart từ storage (deep-scan)
    let items = this.deepScanCartFromStorage();

    // 2) Nếu vẫn rỗng, thử gọi API (chỉ khi có token) để tránh 403
    if (items.length === 0) {
      items = await this.fetchCartFromServerIfPossible();
    }

    if (items.length === 0) {
      this.loading = false;
      this.error = 'Giỏ hàng trống!';
      return;
    }

    const payload: CheckoutRequest = {
      userId: this.auth.userId,
      couponCode: this.fm.value.couponCode || undefined,
      paymentMethod: this.fm.value.paymentMethod!,
      receiverName: this.fm.value.receiverName!,
      receiverPhone: this.fm.value.receiverPhone!,
      shipAddressLine1: this.fm.value.shipAddressLine1!,
      shipAddressLine2: this.fm.value.shipAddressLine2 || undefined,
      shipWard: this.fm.value.shipWard || undefined,
      shipDistrict: this.fm.value.shipDistrict || undefined,
      shipCity: this.fm.value.shipCity || undefined,
      shipPostalCode: this.fm.value.shipPostalCode || undefined,
      shipCountry: this.fm.value.shipCountry || 'VN',
      items
    };

    this.orderApi.checkout(payload).subscribe({
      next: (res: any) => {
        this.loading = false;

        // 3) Clear giỏ ở FE ngay khi đặt xong
        this.clearCartStorageDeep();

        if (res?.paymentUrl) {
          window.location.href = res.paymentUrl as string;
        } else if (res?.orderId) {
          this.router.navigate(['/order-success', res.orderId]);
        } else {
          this.error = 'Phản hồi không hợp lệ từ server.';
        }
      },
      error: (e) => {
        this.loading = false;
        this.error = e?.error?.message || 'Đặt hàng thất bại.';
      }
    });
  }
}
