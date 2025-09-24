package com.gianglt.baitaplon.model;

import com.gianglt.baitaplon.domain.PaymentMethod;
import com.gianglt.baitaplon.domain.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "payments")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Payment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @Enumerated(EnumType.STRING)
    private PaymentMethod method;

    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    private String provider;
    private BigDecimal amount;
    private String txnRef;

    private String bankCode;
    private String bankTranNo;
    private String transactionNo;
    private String responseCode;
    private String secureHash;
    private String orderInfo;
    private String payDate;

    @Column(length = 4000)
    private String rawReturnQuery;

    @CreationTimestamp
    private Instant createdAt;
}
