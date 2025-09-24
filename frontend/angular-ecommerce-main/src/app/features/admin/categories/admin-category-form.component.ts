import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CategoryApiService } from '../../../core/services/category-api.service';
import { Category } from '../../../shared/models/category';

@Component({
  standalone: true,
  selector: 'app-admin-category-form',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-category-form.component.html',
})
export class AdminCategoryFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(CategoryApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isEdit = false;
  id: number | null = null;
  submitting = false;

  fm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    slug: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
    enabled: [true],
  });

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw) {
      this.isEdit = true; this.id = +raw;
      this.api.get(this.id).subscribe((c) => {
        this.fm.patchValue({
          name: c.name,
          slug: c.slug,
          description: c.description ?? '',
          enabled: !!c.enabled,
        });
      });
    }

    // Auto-generate slug từ name nếu slug đang rỗng (hoặc khi thêm mới)
    this.fm.controls.name.valueChanges.subscribe((name) => {
      const cur = this.fm.controls.slug.value;
      if (!this.isEdit || !cur) this.fm.controls.slug.setValue(this.slugify(name), { emitEvent: false });
    });
  }

  private slugify(s: string): string {
    return (s || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }

  hasErr(ctrl: keyof typeof this.fm.controls) {
    const c = this.fm.controls[ctrl];
    return c.touched && c.invalid;
  }

  submit() {
    if (this.fm.invalid || this.submitting) { this.fm.markAllAsTouched(); return; }
    this.submitting = true;

    const v = this.fm.getRawValue() as Category;
    const done = () => this.router.navigate(['/dashboard','categories']);
    const always = () => (this.submitting = false);

    if (this.isEdit && this.id) {
      this.api.update(this.id, v).subscribe({
        next: done,
        error: (err) => { console.error('Update category error', err); alert(this.msg(err)); always(); },
        complete: always
      });
    } else {
      this.api.create(v).subscribe({
        next: done,
        error: (err) => { console.error('Create category error', err); alert(this.msg(err)); always(); },
        complete: always
      });
    }
  }

  private msg(err: any) {
    if (err?.error?.message) return err.error.message;
    if (err?.status === 403) return 'Bạn không có quyền (403).';
    if (err?.status === 401) return 'Phiên đăng nhập đã hết hạn (401).';
    if (err?.status === 400) return 'Dữ liệu không hợp lệ (400).';
    return 'Có lỗi xảy ra khi lưu.';
  }
}
