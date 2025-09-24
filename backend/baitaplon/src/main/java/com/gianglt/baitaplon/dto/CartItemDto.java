package com.gianglt.baitaplon.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemDto {
    private Long id;
    private Long productId;
    private String productName;
    private String sku;
    private String coverImage;
    private Integer quantity;
    private BigDecimal price;
    private BigDecimal lineTotal;
}
