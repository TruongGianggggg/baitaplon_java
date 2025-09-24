import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-order-success',
  imports: [CommonModule, RouterLink],
  templateUrl: './order-success.component.html'
})
export class OrderSuccessComponent {
  private route = inject(ActivatedRoute);
  orderId = Number(this.route.snapshot.paramMap.get('id'));
}
