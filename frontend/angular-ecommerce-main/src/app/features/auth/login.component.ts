import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  auth = inject(AuthService);
  private router = inject(Router);

  fm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  loading = false;
  error = '';

  constructor() {
    // Quan sát khi đã đăng nhập thì điều hướng theo role
    effect(() => {
      if (this.auth.isLoggedIn()) {
        if (this.auth.isAdmin()) {
          this.router.navigateByUrl('/dashboard');
        } else {
          this.router.navigateByUrl('/');
        }
      }
    });
  }

  submit() {
    if (this.fm.invalid || this.loading) return;
    this.loading = true;
    this.error = '';
    this.auth.login(this.fm.getRawValue());
    // loading sẽ tự hết khi effect điều hướng, hoặc bạn có thể tự reset:
    setTimeout(() => (this.loading = false), 300);
  }
}
