import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { UserFormComponent, UserFormValue } from './user-form.component';
import { AdminUserApi } from '../../services/admin-user.api';
import { ApiUser } from '../../../../shared/models/user.model';

type EditData = { id: number; user: ApiUser };

@Component({
  standalone: true,
  selector: 'app-user-edit-dialog',
  imports: [CommonModule, DialogModule, UserFormComponent],
  template: `
  <div class="p-4 w-[min(95vw,720px)]">
    <h2 class="text-lg font-semibold mb-3">Sửa user</h2>
    <app-user-form
      [submitLabel]="'Lưu thay đổi'"
      [passwordOptional]="true"
      [initial]="data.user"
      (submit)="save($event)"
      (cancel)="close(false)">
    </app-user-form>
  </div>
  `
})
export class UserEditDialog {
  private api = inject(AdminUserApi);
  private ref = inject(DialogRef<boolean>);
  data = inject<EditData>(DIALOG_DATA);

  save(v: UserFormValue) {
    // loại password rỗng để BE không overwrite
    const body = { ...v, ...(v.password ? {} : { password: undefined }) };
    this.api.update(this.data.id, body).subscribe({
      next: () => this.close(true),
      error: () => this.close(false),
    });
  }

  close(ok: boolean) { this.ref.close(ok); }
}
