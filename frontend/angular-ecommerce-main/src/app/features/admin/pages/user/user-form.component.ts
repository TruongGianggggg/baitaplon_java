import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiUser } from '../../../../shared/models/user.model';

export type UserFormValue = {
  email: string;
  password?: string;
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  ward?: string;
  district?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  roles: string[];
  enabled: boolean;
};

@Component({
  standalone: true,
  selector: 'app-user-form',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <!-- CARD FORM -->
  <section class="bg-white border rounded-xl shadow-sm p-4 md:p-6">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">
        {{ title || (passwordOptional ? 'Sửa user' : 'Thêm user') }}
      </h3>
      <button type="button" class="text-xs underline text-gray-500 hover:text-gray-700"
              (click)="showDebug = !showDebug">
        {{ showDebug ? 'Ẩn' : 'Hiện' }} debug
      </button>
    </div>

    <div class="h-px bg-gray-100 my-4"></div>

    <form [formGroup]="fm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Email -->
      <div class="space-y-1">
        <label class="block text-sm font-semibold">Email</label>
        <input formControlName="email" type="email" placeholder="vd: user@email.com"
               class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"/>
        <p class="text-xs text-red-600" *ngIf="emailCtl.touched && emailCtl.invalid">Email không hợp lệ</p>
      </div>

      <!-- Password -->
      <div class="space-y-1">
        <label class="block text-sm font-semibold">
          Mật khẩu
          <span class="text-gray-400 text-xs" *ngIf="passwordOptional">(để trống nếu không đổi)</span>
        </label>
        <input formControlName="password" type="password"
               placeholder="{{ passwordOptional ? 'Để trống nếu không đổi' : 'Nhập mật khẩu' }}"
               class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"/>
      </div>

      <!-- Full Name -->
      <div class="space-y-1">
        <label class="block text-sm font-semibold">Họ tên</label>
        <input formControlName="fullName" placeholder="Nguyễn Văn A"
               class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"/>
      </div>

      <!-- Phone -->
      <div class="space-y-1">
        <label class="block text-sm font-semibold">SĐT</label>
        <input formControlName="phone" placeholder="09xxxxxxxx"
               class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"/>
      </div>

      <!-- Address 1 -->
      <div class="md:col-span-2 space-y-1">
        <label class="block text-sm font-semibold">Địa chỉ 1</label>
        <input formControlName="addressLine1" placeholder="Số nhà, đường..."
               class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"/>
      </div>

      <!-- Address 2 -->
      <div class="md:col-span-2 space-y-1">
        <label class="block text-sm font-semibold">Địa chỉ 2</label>
        <input formControlName="addressLine2" placeholder="(Tuỳ chọn)"
               class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"/>
      </div>

      <!-- Ward -->
      <div class="space-y-1">
        <label class="block text-sm font-semibold">Phường/Xã</label>
        <input formControlName="ward"
               class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"/>
      </div>

      <!-- District -->
      <div class="space-y-1">
        <label class="block text-sm font-semibold">Quận/Huyện</label>
        <input formControlName="district"
               class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"/>
      </div>

      <!-- City -->
      <div class="space-y-1">
        <label class="block text-sm font-semibold">Tỉnh/Thành</label>
        <input formControlName="city"
               class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"/>
      </div>

      <!-- Postal Code -->
      <div class="space-y-1">
        <label class="block text-sm font-semibold">Mã bưu chính</label>
        <input formControlName="postalCode"
               class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"/>
      </div>

      <!-- Country -->
      <div class="md:col-span-2 space-y-1">
        <label class="block text-sm font-semibold">Quốc gia</label>
        <input formControlName="country" placeholder="Vietnam"
               class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"/>
      </div>

      <!-- Roles -->
      <div class="space-y-1">
        <label class="block text-sm font-semibold">Roles</label>
        <select formControlName="roles" multiple
                class="w-full border rounded-lg px-3 py-2 h-28 focus:outline-none focus:ring focus:ring-blue-200">
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <p class="text-xs text-gray-500">Đang chọn: {{ fm.value.roles?.length || 0 }} role(s)</p>
      </div>

      <!-- Enabled -->
      <div class="space-y-1">
        <label class="block text-sm font-semibold">Trạng thái</label>
        <select formControlName="enabled"
                class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200">
          <option [ngValue]="true">Enabled</option>
          <option [ngValue]="false">Disabled</option>
        </select>
      </div>
    </form>

    <!-- Actions -->
    <div class="mt-4 flex gap-2">
      <button type="button"
              class="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
              (click)="cancel.emit()">
        Hủy
      </button>
      <button type="button"
              class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              [disabled]="fm.invalid"
              (click)="onSubmit()">
        {{ submitLabel }}
      </button>
    </div>

    <!-- Debug panel -->
    <div *ngIf="showDebug" class="mt-4">
      <div class="bg-gray-50 border rounded-lg p-3 text-xs overflow-auto">
        <pre class="whitespace-pre-wrap">{{ fm.value | json }}</pre>
      </div>
    </div>
  </section>
  `
})
export class UserFormComponent {
  private fb = inject(FormBuilder);

  @Input() submitLabel = 'Lưu';
  @Input() passwordOptional = false;
  @Input() title = '';

  @Input() set initial(value: Partial<ApiUser> | null | undefined) {
    this.fm.reset({
      email: value?.email ?? '',
      password: '',
      fullName: value?.fullName ?? '',
      phone: value?.phone ?? '',
      addressLine1: value?.addressLine1 ?? '',
      addressLine2: value?.addressLine2 ?? '',
      ward: value?.ward ?? '',
      district: value?.district ?? '',
      city: value?.city ?? '',
      postalCode: value?.postalCode ?? '',
      country: value?.country ?? '',
      roles: (value?.roles as string[]) ?? ['USER'],
      enabled: value?.enabled ?? true,
    });
  }

  @Output() submit = new EventEmitter<UserFormValue>();
  @Output() cancel = new EventEmitter<void>();

  fm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    fullName: [''],
    phone: [''],
    addressLine1: [''],
    addressLine2: [''],
    ward: [''],
    district: [''],
    city: [''],
    postalCode: [''],
    country: [''],
    roles: this.fb.nonNullable.control<string[]>(['USER']),
    enabled: this.fb.nonNullable.control<boolean>(true),
  });

  showDebug = false;

  get emailCtl() {
    return this.fm.get('email')!;
  }

  onSubmit() {
    const raw = this.fm.getRawValue();
    const out: UserFormValue = {
      ...raw,
      ...(this.passwordOptional && !raw.password ? { password: undefined } : {}),
    };
    this.submit.emit(out);
  }
}
