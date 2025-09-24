package com.gianglt.baitaplon.dto;

import com.gianglt.baitaplon.domain.PaymentMethod;
import com.gianglt.baitaplon.domain.PaymentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class PaymentDto {
    private Long id;
    private Long orderId;

    private PaymentMethod method;
    private PaymentStatus status;

    private String provider;
    private BigDecimal amount;
    private String txnRef;

    private String bankCode;
    private String bankTranNo;
    private String transactionNo;
    private String responseCode;
    private String orderInfo;
    private String payDate;

    private Instant createdAt;
}
