import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product } from '../shared/models/product';
import { ProductApiService } from '../core/services/product-api.service';
import { environment } from '../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-product',
  imports: [CommonModule, RouterLink, NgOptimizedImage],
  templateUrl: './product.component.html',
})
export class ProductComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private api = inject(ProductApiService);

  loading = signal(true);
  p = signal<Product | null>(null);

  // gallery state
  activeImage = signal<string>('');
  mainLoaded = signal(false);

  // autoplay
  autoplayMs = 3500;
  private autoId: any = null;
  private resumeId: any = null;
  private touchX: number | null = null;

  ngOnInit() {
    const raw = this.route.snapshot.paramMap.get('id');
    const id = raw ? +raw : 0;
    if (!id) { this.loading.set(false); return; }

    this.api.get(id).subscribe({
      next: (prod) => {
        this.p.set(prod);
        const imgs = this.images();
        this.setActive(imgs[0] ?? this.placeholder);
        this.startAutoplay();
      },
      error: (e) => { console.error('Load product error', e); this.p.set(null); },
      complete: () => this.loading.set(false),
    });
  }

  ngOnDestroy() {
    this.clearAutoplay();
    if (this.resumeId) { clearTimeout(this.resumeId); this.resumeId = null; }
  }

  // ==== Helpers ====
  private get apiOrigin(): string {
    const api = environment.apiUrl ?? '';
    try { return new URL(api).origin; }
    catch { return api.match(/^https?:\/\/[^/]+/i)?.[0] ?? ''; }
  }

  private readonly placeholder =
    'data:image/svg+xml;utf8,' + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640">
         <rect width="100%" height="100%" fill="#f1f5f9"/>
         <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
               font-family="Inter,Arial" font-size="18" fill="#94a3b8">No image</text>
       </svg>`
    );

  images(): string[] {
    const prod = this.p();
    if (!prod) return [];
    const arr = [
      ...(prod.coverImage ? [prod.coverImage] : []),
      ...(prod.detailImages ?? []),
    ];
    return arr.map((x) =>
      /^(https?:|data:)/i.test(x || '') ? (x as string)
        : `${this.apiOrigin}/${String(x).replace(/^\/+/, '')}`
    );
  }

  // ---- Image switching + effects ----
  setActive(url: string) {
    this.mainLoaded.set(false);
    this.activeImage.set(url || this.placeholder);
  }

  // ✅ Public wrapper để gọi từ template
  onThumbClick(url: string) {
    this.setActive(url);
    this.pauseThenResume();
  }

  prevImage(userAction = false) {
    const list = this.images();
    if (!list.length) return;
    const cur = this.activeImage();
    const idx = Math.max(0, list.findIndex(u => u === cur));
    const nextIdx = (idx - 1 + list.length) % list.length;
    this.setActive(list[nextIdx]);
    if (userAction) this.pauseThenResume();
  }

  nextImage(userAction = false) {
    const list = this.images();
    if (!list.length) return;
    const cur = this.activeImage();
    const idx = Math.max(0, list.findIndex(u => u === cur));
    const nextIdx = (idx + 1) % list.length;
    this.setActive(list[nextIdx]);
    if (userAction) this.pauseThenResume();
  }

  onMainImgError(ev: Event) {
    (ev.target as HTMLImageElement).src = this.placeholder;
    this.mainLoaded.set(true);
  }

  onMainImgLoad() {
    this.mainLoaded.set(true);
  }

  // ---- Autoplay controls ----
  private startAutoplay() {
    this.clearAutoplay();
    this.autoId = setInterval(() => this.nextImage(false), this.autoplayMs);
  }

  private clearAutoplay() {
    if (this.autoId) { clearInterval(this.autoId); this.autoId = null; }
  }

  // public vì gọi từ template (hover)
  pauseAuto() {
    this.clearAutoplay();
    if (this.resumeId) { clearTimeout(this.resumeId); this.resumeId = null; }
  }

  // public vì gọi từ template (hover)
  resumeAuto() {
    if (!this.autoId) this.startAutoplay();
  }

  // vẫn để private, chỉ gọi nội bộ qua onThumbClick/prev/next
  private pauseThenResume() {
    this.pauseAuto();
    this.resumeId = setTimeout(() => this.resumeAuto(), 8000);
  }

  // ---- Keyboard + touch (mobile swipe) ----
  onKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') { this.prevImage(true); }
    else if (e.key === 'ArrowRight') { this.nextImage(true); }
  }

  onTouchStart(e: TouchEvent) {
    this.touchX = e.touches?.[0]?.clientX ?? null;
  }

  onTouchEnd(e: TouchEvent) {
    if (this.touchX == null) return;
    const dx = (e.changedTouches?.[0]?.clientX ?? this.touchX) - this.touchX;
    const THRESH = 30;
    if (dx > THRESH) this.prevImage(true);
    else if (dx < -THRESH) this.nextImage(true);
    this.touchX = null;
  }

  inStock = computed(() => (this.p()?.stock ?? 0) > 0);

  addToCart() {
    alert('Đã thêm vào giỏ');
  }
}
