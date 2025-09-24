import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, map, of, tap } from 'rxjs';
import { Product } from '../../shared/models/product';
import { ProductApiService } from './product-api.service';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private api = inject(ProductApiService);

  private productsCache: Product[] = [];
  private productsSubject = new BehaviorSubject<Product[]>([]);
  readonly products$ = this.productsSubject.asObservable();

  /** Lấy danh sách (trang lớn) và cache */
  getAll(): Observable<Product[]> {
    if (this.productsCache.length > 0) return of(this.productsCache);

    return this.api.search({ page: 0, size: 100, sort: 'id,desc' }).pipe(
      map(res => res?.content ?? []),
      tap(list => {
        this.productsCache = list;
        this.productsSubject.next(list);
      })
    );
  }

  /** Lấy vài sản phẩm ưu đãi */
  getOffers(count = 5): Observable<Product[]> {
    return this.getAll().pipe(map(list => list.slice(0, count)));
  }

  /** Lấy chi tiết theo id; ưu tiên cache, fallback gọi GET /products/{id} */
  getById(id: number | string): Observable<Product | undefined> {
    const nid = Number(id);
    if (Number.isFinite(nid) && this.productsCache.length > 0) {
      const hit = this.productsCache.find(p => p.id === nid);
      if (hit) return of(hit);
    }
    return this.api.get(nid).pipe(
      tap(p => {
        if (p && !this.productsCache.some(x => x.id === p.id)) {
          this.productsCache = [...this.productsCache, p];
          this.productsSubject.next(this.productsCache);
        }
      })
    );
  }
}
