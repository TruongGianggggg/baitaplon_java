import { Component, inject, signal } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { AdminUserApi } from '../../services/admin-user.api';
import { ApiUser } from '../../../../shared/models/user.model';
import { UserCreateDialog } from './user-create.dialog';
import { UserEditDialog } from './user-edit.dialog';

@Component({
  standalone: true,
  selector: 'app-admin-users',
  imports: [CommonModule, FormsModule, NgFor, NgIf, DialogModule],
  templateUrl: './admin-users.component.html',
})
export class AdminUsersComponent {
  private api = inject(AdminUserApi);
  private dialog = inject(Dialog);

  loading = signal(false);
  q = signal('');
  users = signal<ApiUser[]>([]);
  error = signal('');

  ngOnInit() { this.fetch(); }

  fetch() {
    this.loading.set(true);
    this.error.set('');
    this.api.list(this.q()).subscribe({
      next: (list) => { this.users.set(list); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.message || 'Lỗi tải danh sách'); this.loading.set(false); }
    });
  }

  openCreate() {
    const ref = this.dialog.open<boolean>(UserCreateDialog);
    ref.closed.subscribe(ok => { if (ok) this.fetch(); });
  }

  openEdit(u: ApiUser) {
    const ref = this.dialog.open<boolean>(UserEditDialog, {
      data: { id: u.id!, user: u }
    });
    ref.closed.subscribe(ok => { if (ok) this.fetch(); });
  }

  remove(u: ApiUser) {
    if (!confirm(`Xóa user ${u.email}?`)) return;
    this.loading.set(true);
    this.api.delete(u.id!).subscribe({
      next: () => { this.loading.set(false); this.fetch(); },
      error: (e) => { this.loading.set(false); this.error.set(e?.error?.message || 'Xóa thất bại'); }
    });
  }
}
