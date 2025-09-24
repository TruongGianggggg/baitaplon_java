package com.gianglt.baitaplon.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "coupons", indexes = {
        @Index(name = "uk_coupon_code", columnList = "code", unique = true),
        @Index(name = "idx_coupon_active_time", columnList = "starts_at,ends_at")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Coupon {

    public enum DiscountType { PERCENT, FIXED }
    public enum TargetType { ALL, CATEGORY, PRODUCT }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @Column(length = 150)
    private String name;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 16)
    private DiscountType discountType;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal discountValue; // % (0-100) hoặc số tiền

    @Column(precision = 19, scale = 2)
    private BigDecimal maxDiscountAmount; // trần giảm (cho loại %)

    @Column(precision = 19, scale = 2)
    private BigDecimal minOrderAmount; // điều kiện đơn tối thiểu

    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 16)
    private TargetType targetType; // ALL/CATEGORY/PRODUCT

    // Nếu targetType = CATEGORY
    @ManyToMany
    @JoinTable(name = "coupon_categories",
            joinColumns = @JoinColumn(name = "coupon_id"),
            inverseJoinColumns = @JoinColumn(name = "category_id"))
    private Set<Category> categories = new HashSet<>();

    // Nếu targetType = PRODUCT
    @ManyToMany
    @JoinTable(name = "coupon_products",
            joinColumns = @JoinColumn(name = "coupon_id"),
            inverseJoinColumns = @JoinColumn(name = "product_id"))
    private Set<Product> products = new HashSet<>();

    private Boolean enabled = true;

    // thời gian hiệu lực
    @Column(name = "starts_at")
    private Instant startsAt;
    @Column(name = "ends_at")
    private Instant endsAt;

    // giới hạn sử dụng
    private Integer totalQuantity;  // null = không giới hạn
    private Integer usedCount;      // đã dùng
    private Integer perUserLimit;   // null/0 = không giới hạn

    private Boolean stackable = false; // có thể cộng dồn với mã khác (để mở rộng sau)

    @CreationTimestamp private Instant createdAt;
    @UpdateTimestamp  private Instant updatedAt;
}
