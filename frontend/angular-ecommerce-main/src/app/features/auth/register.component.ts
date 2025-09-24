import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  fm = this.fb.nonNullable.group({
    fullName: [''],
    phone: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  loading = false;
  error = '';

  submit() {
    if (this.fm.invalid || this.loading) return;
    this.loading = true;
    this.error = '';

    // đăng ký theo phong cách service của bạn
    this.auth.register(this.fm.getRawValue());

    setTimeout(() => {
      this.loading = false;
      // nếu BE trả token kèm user, bạn đã được login luôn -> về trang chủ
      // nếu không muốn tự login sau register, bạn có thể navigate /login
      this.router.navigateByUrl('/');
    }, 400);
  }
}
