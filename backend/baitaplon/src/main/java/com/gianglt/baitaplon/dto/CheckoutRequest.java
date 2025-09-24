package com.gianglt.baitaplon.dto;

import com.gianglt.baitaplon.domain.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CheckoutRequest {
    @NotNull
    private Long userId;

    private String couponCode;
    private PaymentMethod paymentMethod;

    // Nếu muốn cho khách sửa địa chỉ khi đặt hàng thì thêm các field này:
    private String receiverName;
    private String receiverPhone;
    private String shipAddressLine1;
    private String shipAddressLine2;
    private String shipWard;
    private String shipDistrict;
    private String shipCity;
    private String shipPostalCode;
    private String shipCountry;

    @NotNull
    private List<CartItemDto> items;
}
