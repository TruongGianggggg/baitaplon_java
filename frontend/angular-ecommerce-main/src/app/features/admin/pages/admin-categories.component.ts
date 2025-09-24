import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CategoryApiService } from '../../../core/services/category-api.service';
import { Category } from '../../../shared/models/category';
import { PageResponse } from '../../../shared/models/page-response.model';

@Component({
  standalone: true,
  selector: 'app-admin-categories',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-categories.component.html',
})
export class AdminCategoriesComponent implements OnInit {
  private api = inject(CategoryApiService);

  data: Category[] = [];
  keyword = '';
  enabled: '' | 'true' | 'false' = '';
  page = 0;
  size = 10;
  sort = 'id,desc';
  totalElements = 0;
  totalPages = 0;
  loading = false;

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.search({
      keyword: this.keyword || undefined,
      enabled: this.enabled === '' ? undefined : this.enabled === 'true',
      page: this.page,
      size: this.size,
      sort: this.sort
    }).subscribe({
      next: (res: PageResponse<Category>) => {
        this.data = res?.content ?? [];
        this.totalElements = res?.totalElements ?? this.data.length;
        this.totalPages = res?.totalPages ?? 1;
      },
      error: (e) => {
        console.error('Load categories error', e);
        this.data = []; this.totalElements = 0; this.totalPages = 0;
      },
      complete: () => this.loading = false
    });
  }

  searchNow() { this.page = 0; this.load(); }

  changeSort(field: 'id'|'name'|'slug'|'createdAt'|'updatedAt') {
    const [cur, dir] = this.sort.split(',') as [string, 'asc'|'desc'];
    const next: 'asc'|'desc' = (cur === field && dir === 'asc') ? 'desc' : 'asc';
    this.sort = `${field},${next}`; this.load();
  }

  gotoPage(p: number) { if (p>=0 && p<this.totalPages) { this.page = p; this.load(); } }

  toggleEnabled(c: Category) {
    if (!c.id) return;
    this.api.update(c.id, { ...c, enabled: !c.enabled }).subscribe(() => this.load());
  }

  delete(id: number) {
    if (confirm('Xoá danh mục này?')) this.api.delete(id).subscribe(() => this.load());
  }
}
