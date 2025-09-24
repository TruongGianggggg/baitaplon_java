// src/app/payment/payment-success/payment-success.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

type VnpayReturnResult = {
  success: boolean;
  message?: string;
  orderId?: number;
  txnRef?: string;         // vnp_TxnRef (nếu bạn có trả về)
  amount?: number;         // số tiền (nếu có)
  payDate?: string;        // vnp_PayDate (nếu có)
  bankCode?: string;       // vnp_BankCode (nếu có)
};

@Component({
  standalone: true,
  selector: 'app-payment-success',
  imports: [CommonModule],
  templateUrl: './payment-success.component.html'
})
export class PaymentSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http  = inject(HttpClient);
  private router = inject(Router);

  loading = true;
  error = '';
  result: VnpayReturnResult | null = null;

  async ngOnInit() {
    // Lấy toàn bộ query params VNPAY trả về
    const qp = this.route.snapshot.queryParamMap;
    let params = new HttpParams();
    qp.keys.forEach(k => { const v = qp.get(k); if (v != null) params = params.set(k, v); });

    try {
      // Gọi API xác thực & mapping order
      const api = `${environment.apiUrl}/api/payments/vnpay-return`;
      const res = await this.http.get<VnpayReturnResult>(api, { params }).toPromise();

      this.result = res ?? null;

      if (res?.success && res?.orderId) {
        // Điều hướng sang trang thành công chung (dùng lại UI COD)
        this.router.navigate(['/order-success', res.orderId]);
        return;
      }

      // Nếu không success, hiển thị lỗi ngay tại trang này
      if (!res?.success) {
        this.error = res?.message || 'Thanh toán không thành công hoặc bị hủy.';
      }
    } catch (e: any) {
      this.error = e?.error?.message || 'Có lỗi khi xác thực thanh toán.';
    } finally {
      this.loading = false;
    }
  }
}
