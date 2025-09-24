import { Component, inject } from '@angular/core';
import { DialogRef, DialogModule } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { UserFormComponent, UserFormValue } from './user-form.component';
import { AdminUserApi } from '../../services/admin-user.api';

@Component({
  standalone: true,
  selector: 'app-user-create-dialog',
  imports: [CommonModule, DialogModule, UserFormComponent],
  template: `
  <div class="p-4 w-[min(95vw,720px)]">
    <h2 class="text-lg font-semibold mb-3">Thêm user</h2>
    <app-user-form
      [submitLabel]="'Tạo user'"
      [passwordOptional]="false"
      (submit)="create($event)"
      (cancel)="close(false)">
    </app-user-form>
  </div>
  `
})
export class UserCreateDialog {
  private api = inject(AdminUserApi);
  private ref = inject(DialogRef<boolean>);

  create(v: UserFormValue) {
    if (!v.password) return; // tạo mới cần mật khẩu
    this.api.create(v).subscribe({
      next: () => this.close(true),
      error: () => this.close(false),
    });
  }

  close(ok: boolean) { this.ref.close(ok); }
}
