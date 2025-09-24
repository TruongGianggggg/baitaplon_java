import { Injectable, inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { TokenStorage } from './token-storage.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(TokenStorage);
  const token = store.get();
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};

// app.config.ts (hoặc providers trong app.module.ts)
// providers: [ provideHttpClient(withInterceptors([authInterceptor])) ]
