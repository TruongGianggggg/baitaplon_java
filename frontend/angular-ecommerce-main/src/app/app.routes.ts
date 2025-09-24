import { Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { CartComponent } from './cart/cart.component';
import { ProductComponent } from './product/product.component';
import { PaymentSuccessComponent } from './payment/payment-success/payment-success.component';

import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { ProfileComponent } from './features/auth/profile.component';

import { adminGuard } from './core/admin.guard';

import { AdminLayoutComponent } from './features/admin/admin-layout.component';
import { AdminProductsComponent } from './features/admin/pages/admin-products.component';
import { AdminProductFormComponent } from './features/admin/products/admin-product-form.component';
import { AdminCouponsComponent } from './features/admin/coupons/admin-coupons.component';
import { AdminOrdersComponent } from './features/admin/orders/admin-orders.component';
import { OrdersPageComponent } from './features/auth/user/orders-page.component';

import { PaymentHistoryComponent } from './payment/payment-history.component';
import { AdminPaymentsComponent } from './features/admin/pages/payments/admin-payments.component';


import { CategoryProductsComponent } from './home/category-products.component';



export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'cart', component: CartComponent },
  { path: 'products/:id', component: ProductComponent },
  { path: 'PaymentSuccess', component: PaymentSuccessComponent },
    { path: 'c/:id', component: CategoryProductsComponent }, // /c/123 hoặc /c/all


  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'profile', component: ProfileComponent },

  { path: 'payment/success', component: PaymentSuccessComponent },   // ← VNPAY return page
    { path: 'payments', component: PaymentHistoryComponent },



  { path: 'checkout', loadComponent: () => import('./checkout/checkout.component').then(m => m.CheckoutComponent) },
  { path: 'order-success/:id', loadComponent: () => import('./checkout/order-success.component').then(m => m.OrderSuccessComponent) },
  { path: 'orders', component: OrdersPageComponent },
    { path: 'orders/:id', loadComponent: () => import('./features/auth/user/order-detail.component').then(m => m.OrderDetailComponent) },



  {
    path: 'dashboard',
    canActivate: [adminGuard],
    component: AdminLayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./features/admin/pages/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'users', loadComponent: () => import('./features/admin/pages/user/admin-users.component').then(m => m.AdminUsersComponent) },

      // dùng import trực tiếp
      { path: 'orders', component: AdminOrdersComponent },
      { path: 'coupons', component: AdminCouponsComponent },

      { path: 'products', component: AdminProductsComponent },
      { path: 'products/new', component: AdminProductFormComponent },
      { path: 'products/edit/:id', component: AdminProductFormComponent },

      { path: 'customers', loadComponent: () => import('./features/admin/pages/admin-customers.component').then(m => m.AdminCustomersComponent) },
      { path: 'categories', loadComponent: () => import('./features/admin/pages/admin-categories.component').then(m => m.AdminCategoriesComponent) },
      { path: 'categories/new', loadComponent: () => import('./features/admin/categories/admin-category-form.component').then(m => m.AdminCategoryFormComponent) },
      { path: 'categories/edit/:id', loadComponent: () => import('./features/admin/categories/admin-category-form.component').then(m => m.AdminCategoryFormComponent) },
      { path: 'settings', loadComponent: () => import('./features/admin/pages/admin-settings.component').then(m => m.AdminSettingsComponent) },
            { path: 'payments', component: AdminPaymentsComponent },


   ]
  }


];
