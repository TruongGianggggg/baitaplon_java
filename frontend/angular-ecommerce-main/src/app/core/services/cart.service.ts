// import { inject, Injectable } from '@angular/core';
// import { HttpClient, HttpParams } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { Cart } from '../../shared/models/cart-product';

// @Injectable({ providedIn: 'root' })
// export class CartApiService {
//   private http = inject(HttpClient);
//   private baseUrl = 'http://localhost:8080/api/cart';

//   getCart(): Observable<Cart> {
//     return this.http.get<Cart>(this.baseUrl);
//   }

//   add(productId: number, quantity: number): Observable<Cart> {
//     const params = new HttpParams().set('productId', productId).set('quantity', quantity);
//     return this.http.post<Cart>(`${this.baseUrl}/add`, null, { params });
//   }

//   update(productId: number, quantity: number): Observable<Cart> {
//     const params = new HttpParams().set('productId', productId).set('quantity', quantity);
//     return this.http.put<Cart>(`${this.baseUrl}/update`, null, { params });
//   }

//   remove(productId: number): Observable<Cart> {
//     const params = new HttpParams().set('productId', productId);
//     return this.http.delete<Cart>(`${this.baseUrl}/remove`, { params });
//   }

//   clear(): Observable<void> {
//     return this.http.delete<void>(`${this.baseUrl}/clear`);
//   }
// }
