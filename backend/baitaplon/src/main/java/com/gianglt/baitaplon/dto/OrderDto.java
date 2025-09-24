package com.gianglt.baitaplon.dto;

import com.gianglt.baitaplon.domain.OrderStatus;
import com.gianglt.baitaplon.domain.PaymentMethod;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDto {
    private Long id;
    private Long userId;          // 👈 thêm
    private String userEmail;     // 👈 thêm
    private String userFullName;

    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal shippingFee;
    private BigDecimal totalAmount;
    private String couponCode;

    private OrderStatus status;
    private PaymentMethod paymentMethod;

    private String receiverName;
    private String receiverPhone;
    private String shipAddressLine1;
    private String shipAddressLine2;
    private String shipWard;
    private String shipDistrict;
    private String shipCity;
    private String shipPostalCode;
    private String shipCountry;

    private Instant createdAt;

    private List<OrderItemDto> items;
    private Integer itemsTotalQuantity;

    //private PaymentDto payment;   // 👈 thêm nếu cần
}
