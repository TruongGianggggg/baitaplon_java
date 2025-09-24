package com.gianglt.baitaplon.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "products",
        indexes = {
                @Index(name = "uk_product_sku", columnList = "sku", unique = true),
                @Index(name = "uk_product_slug", columnList = "slug", unique = true),
                @Index(name = "idx_product_enabled", columnList = "enabled"),
                @Index(name = "idx_product_name", columnList = "name")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, unique = true, length = 180)
    private String slug;

    @Column(nullable = false, unique = true, length = 64)
    private String sku;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal price;

    @Column(length = 8)
    private String currency;

    @Column(nullable = false)
    private Integer stock;

    private Boolean enabled = true;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer","handler"})
    private Category category;

    // Ảnh
    @Column(name = "cover_image", length = 500)
    private String coverImage;    // 1 ảnh đại diện

    @Column(name = "detail_images", columnDefinition = "TEXT")
    private String detailImages;  // JSON string chứa danh sách ảnh detail

    @CreationTimestamp private Instant createdAt;
    @UpdateTimestamp  private Instant updatedAt;
}
