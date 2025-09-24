import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ProductApiService } from '../core/services/product-api.service';
import { CategoryApiService } from '../core/services/category-api.service';

import { HomeProductComponent } from './components/home-product/home-product.component';
import { HomeProductLoadingComponent } from './components/home-product-loading/home-product-loading.component';

import { Product } from '../shared/models/product';
import { Category } from '../shared/models/category';
import { PageResponse } from '../shared/models/page-response.model';

type CatSection = { cat: Category; items: Product[]; loading: boolean; };
type Banner = { src: string; href?: string; alt?: string };

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [CommonModule, NgIf, NgFor, RouterLink, HomeProductComponent, HomeProductLoadingComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit, OnDestroy {
  private productApi = inject(ProductApiService);
  private catApi = inject(CategoryApiService);

  // ===== Banner =====
  banners: Banner[] = [];          // auto detect trong /public/banners
  bannerIndex = 0;
  prevIndex = 0;

  // Tốc độ nhanh hơn & mượt hơn
  private BANNER_INTERVAL = 3200;  // nhanh hơn
  FADE_MS = 350;                   // thời gian cross-fade (ms)
  private bannerTimer: any;
  animating = false;

  // Khung 21:9, ảnh hiện trọn vẹn (contain) + nền mờ fill
  bannerAspect = 21 / 9;
  bannerKenBurns = true;

  // Auto detect file banner-*.{jpg,jpeg,png,webp}
  private BANNERS_MAX = 64;
  private STOP_AFTER_MISS = 4;
  private exts = ['jpg', 'jpeg', 'png', 'webp'];

  // ===== Newest =====
  loadingNewest = true;
  newest: Product[] = [];

  // ===== Categories + sections =====
  cats: Category[] = [];
  catSections: CatSection[] = [];
  loadingCats = true;

  sectionsCount = 3;
  itemsPerSection = 8;
  private cacheKey = 'homeCatPick';
  private cacheMs = 60 * 60 * 1000; // 1 giờ
  private sectionRotateTimer: any;   // auto đổi danh mục theo cache

  async ngOnInit() {
    await this.loadBannersDynamic();
    this.startBanner();
    this.loadNewest();
    this.loadCategoriesAndSections();
    this.scheduleSectionsAutoRotate(); // tự động đổi danh mục theo cache 1 giờ
  }
  ngOnDestroy() {
    this.stopBanner();
    if (this.sectionRotateTimer) { clearTimeout(this.sectionRotateTimer); this.sectionRotateTimer = null; }
  }

  // ---------- Banner ----------
  private startBanner() {
    this.stopBanner();
    if (this.banners.length > 1) {
      this.bannerTimer = setInterval(() => this.nextBanner(+1), this.BANNER_INTERVAL);
    }
  }
  private stopBanner() {
    if (this.bannerTimer) { clearInterval(this.bannerTimer); this.bannerTimer = null; }
  }
  nextBanner(delta: number) {
    if (!this.banners.length || this.animating) return;
    this.prevIndex = this.bannerIndex;
    this.bannerIndex = (this.bannerIndex + delta + this.banners.length) % this.banners.length;
    this.animating = true;
    setTimeout(() => (this.animating = false), this.FADE_MS);
  }
  goBanner(i: number) {
    if (i < 0 || i >= this.banners.length || i === this.bannerIndex) return;
    this.prevIndex = this.bannerIndex;
    this.bannerIndex = i;
    this.animating = true;
    setTimeout(() => (this.animating = false), this.FADE_MS);
    this.startBanner(); // reset auto timer
  }

  private async loadBannersDynamic(): Promise<void> {
    const found: Banner[] = [];
    let miss = 0;
    for (let i = 1; i <= this.BANNERS_MAX && miss < this.STOP_AFTER_MISS; i++) {
      let ok = false;
      for (const ext of this.exts) {
        const url = `/banners/banner-${i}.${ext}`;
        // eslint-disable-next-line no-await-in-loop
        ok = await this.testImage(url);
        if (ok) { found.push({ src: url, href: '/c/all', alt: `Banner ${i}` }); break; }
      }
      miss = ok ? 0 : miss + 1;
    }
    this.banners = found;
  }
  private testImage(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url + `?v=${Date.now()}`; // tránh cache khi dev
    });
  }

  // ---------- API ----------
  private loadNewest() {
    this.productApi.search({ page: 0, size: 12, sort: 'createdAt,desc', enabled: true }).subscribe({
      next: (res: PageResponse<Product>) => { this.newest = res?.content ?? []; },
      error: () => { this.newest = []; },
      complete: () => { this.loadingNewest = false; }
    });
  }

  private loadCategoriesAndSections() {
    this.loadingCats = true;
    this.catApi.listAll().subscribe({
      next: (list) => {
        this.cats = (list ?? []).filter(c => !!c.id);

        const picked = this.pickRandomCatsWithCache(this.cats.map(c => c.id!));
        const pickedCats = picked
          .map(id => this.cats.find(c => c.id === id)!)
          .filter(Boolean);

        // Chuẩn bị mảng rỗng, sẽ chỉ giữ section có sản phẩm
        this.catSections = [];

        // Với mỗi danh mục được pick: tạo placeholder (để hiện skeleton),
        // sau đó gọi API; nếu không có sản phẩm thì xóa placeholder.
        pickedCats.forEach((c) => {
          const placeholder: CatSection = { cat: c, items: [], loading: true };
          this.catSections.push(placeholder);

          this.productApi.search({
            categoryId: c.id,
            page: 0, size: this.itemsPerSection,
            sort: 'createdAt,desc', enabled: true
          }).subscribe({
            next: (res: PageResponse<Product>) => {
              const items = res?.content ?? [];
              const idx = this.catSections.findIndex(s => s.cat.id === c.id);
              if (items.length === 0) {
                if (idx >= 0) this.catSections.splice(idx, 1); // ẩn section rỗng
                return;
              }
              if (idx >= 0) {
                this.catSections[idx].items = items;
              }
            },
            error: () => {
              const idx = this.catSections.findIndex(s => s.cat.id === c.id);
              if (idx >= 0) this.catSections.splice(idx, 1); // lỗi cũng bỏ luôn
            },
            complete: () => {
              const idx = this.catSections.findIndex(s => s.cat.id === c.id);
              if (idx >= 0) this.catSections[idx].loading = false;
            }
          });
        });
      },
      error: () => { this.cats = []; },
      complete: () => { this.loadingCats = false; }
    });
  }

  private pickRandomCatsWithCache(allIds: number[]): number[] {
    try {
      const raw = localStorage.getItem(this.cacheKey);
      if (raw) {
        const obj = JSON.parse(raw) as { ids: number[]; exp: number };
        if (obj?.ids?.length && Date.now() < obj.exp) return obj.ids.slice(0, this.sectionsCount);
      }
    } catch {}
    const shuffled = [...allIds].sort(() => Math.random() - 0.5);
    const ids = shuffled.slice(0, Math.min(this.sectionsCount, shuffled.length));
    try { localStorage.setItem(this.cacheKey, JSON.stringify({ ids, exp: Date.now() + this.cacheMs })); } catch {}
    return ids;
  }

  // === Auto rotate danh mục mỗi 1 giờ (dựa trên exp trong localStorage) ===
  private scheduleSectionsAutoRotate() {
    if (this.sectionRotateTimer) { clearTimeout(this.sectionRotateTimer); this.sectionRotateTimer = null; }

    let delay = this.cacheMs; // mặc định 1 giờ
    try {
      const raw = localStorage.getItem(this.cacheKey);
      if (raw) {
        const obj = JSON.parse(raw) as { ids: number[]; exp: number };
        if (obj?.exp) {
          const remain = obj.exp - Date.now();
          if (remain > 0) delay = remain;
        }
      }
    } catch {}

    this.sectionRotateTimer = setTimeout(() => {
      try { localStorage.removeItem(this.cacheKey); } catch {}
      this.loadCategoriesAndSections();
      this.scheduleSectionsAutoRotate(); // lặp cho chu kỳ kế tiếp
    }, Math.max(1000, delay));
  }

  // Giữ lại để có thể dùng thủ công ở chỗ khác (không render nút)
  resetSections() {
    try { localStorage.removeItem(this.cacheKey); } catch {}
    this.loadCategoriesAndSections();
    this.scheduleSectionsAutoRotate();
  }

  // ---------- Helpers ----------
  trackByCat = (_: number, c: Category) => c.id!;
  trackBySection = (_: number, s: CatSection) => s.cat.id!;
  trackByProd = (_: number, p: Product) => p.id!;
}
