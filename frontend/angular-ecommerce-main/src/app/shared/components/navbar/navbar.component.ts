// ... các import hiện có
import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { AuthService } from '../../../core/auth.service';
import { CategoryApiService } from '../../../core/services/category-api.service';
import { Category } from '../../../shared/models/category';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit {
  auth = inject(AuthService);
  private catApi = inject(CategoryApiService);
  private router = inject(Router);

  cartCount = signal<number>(0);
  categories = signal<Category[]>([]);

  // 👇 Thêm 3 dòng state & 3 handler click
  isCatOpen = false;
  isUserOpen = false;

  closeAll() {
    this.isCatOpen = false;
    this.isUserOpen = false;
  }
  toggleCat(event: MouseEvent) {
    event.stopPropagation();
    this.isCatOpen = !this.isCatOpen;
    if (this.isCatOpen) this.isUserOpen = false;
  }
  toggleUser(event: MouseEvent) {
    event.stopPropagation();
    this.isUserOpen = !this.isUserOpen;
    if (this.isUserOpen) this.isCatOpen = false;
  }

  ngOnInit() {
    this.catApi.listAll().subscribe((list) => this.categories.set(list));
  }

  userName = computed(
    () => this.auth.user()?.fullName || this.auth.user()?.email || 'Tài khoản'
  );

  initials = computed(() => {
    const u = this.auth.user();
    if (!u) return 'U';
    if (u.fullName && u.fullName.trim()) {
      const parts = u.fullName.trim().split(/\s+/);
      return ((parts[0]?.[0] ?? '') + (parts.at(-1)?.[0] ?? '')).toUpperCase();
    }
    return (u.email?.[0] || 'U').toUpperCase();
  });

  goCategory(cat: Category) {
    this.router.navigate(['/products'], { queryParams: { categoryId: cat.id } });
    this.closeAll();
  }
}
