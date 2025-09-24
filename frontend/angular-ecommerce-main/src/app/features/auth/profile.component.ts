import { Component, inject, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { UserApi } from '../../core/user.api';
import { ApiUser, ApiUserPartial } from '../../shared/models/user.model';

@Component({
  standalone: true,
  selector: 'app-profile',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.component.html',
})
export class ProfileComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private api = inject(UserApi);

  loading = false;
  saved = false;
  error = '';

  // ---- Toast state ----
  toastOpen = signal(false);
  toastType = signal<'success'|'error'>('success');
  toastMsg = signal<string>('');
  private toastTimer?: number;

  fm = this.fb.nonNullable.group({
    email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
    fullName: [''],
    phone: [''],
    addressLine1: [''],
    addressLine2: [''],
    ward: [''],
    district: [''],
    city: [''],
    postalCode: [''],
    country: [''],
  });

  constructor() {
    effect(() => {
      const u = this.auth.user();
      if (!u) return;
      this.patchFromUser(u);
    });
  }

  private patchFromUser(u: ApiUser) {
    this.fm.patchValue({
      email: u.email || '',
      fullName: u.fullName || '',
      phone: u.phone || '',
      addressLine1: u.addressLine1 || '',
      addressLine2: u.addressLine2 || '',
      ward: u.ward || '',
      district: u.district || '',
      city: u.city || '',
      postalCode: u.postalCode || '',
      country: u.country || '',
    }, { emitEvent: false });
    this.saved = false;
  }

  get canSave() {
    return this.fm.valid && this.fm.dirty && !this.loading;
  }

  submit() {
    if (!this.canSave) return;

    const me = this.auth.user();
    if (!me?.id) return;

    const p: ApiUserPartial = this.fm.getRawValue();
    this.loading = true; this.error = ''; this.saved = false;

    this.api.update(me.id, p).subscribe({
      next: (updated) => {
        this.auth.applyUser(updated);
        this.patchFromUser(updated);
        this.fm.markAsPristine();
        this.saved = true;
        this.loading = false;
        this.showToast('success', 'Cập nhật thông tin thành công!');
      },
      error: () => {
        this.error = 'Cập nhật không thành công, vui lòng thử lại.';
        this.loading = false;
        this.showToast('error', 'Có lỗi xảy ra. Vui lòng thử lại.');
      },
    });
  }

  // ===== TOAST =====
  showToast(type: 'success'|'error', msg: string) {
    this.toastType.set(type);
    this.toastMsg.set(msg);
    this.toastOpen.set(true);

    // clear timer cũ (nếu có) rồi đặt timer mới
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastOpen.set(false), 2500);
  }
  closeToast() {
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
    this.toastOpen.set(false);
  }
}
