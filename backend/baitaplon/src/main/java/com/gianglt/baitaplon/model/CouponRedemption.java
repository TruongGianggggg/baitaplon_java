package com.gianglt.baitaplon.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "coupon_redemptions", indexes = {
        @Index(name = "idx_coupon_redemption_user", columnList = "user_id"),
        @Index(name = "idx_coupon_redemption_coupon", columnList = "coupon_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CouponRedemption {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "coupon_id", nullable = false)
    private Coupon coupon;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // có thể gắn vào orderId khi checkout thành công
    private Long orderId;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal discountAmount;

    @CreationTimestamp
    private Instant redeemedAt;
}
