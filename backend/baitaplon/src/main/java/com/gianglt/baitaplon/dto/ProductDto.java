package com.gianglt.baitaplon.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductDto {
    private Long id;
    private String name;
    private String slug;
    private String sku;
    private String description;
    private BigDecimal price;
    private String currency;
    private Integer stock;
    private Boolean enabled;

    private CategoryBriefDto category;   // chỉ id + name

    private String coverImage;
    private List<String> detailImages;   // parse từ JSON string của entity

    private Instant createdAt;
    private Instant updatedAt;
}
