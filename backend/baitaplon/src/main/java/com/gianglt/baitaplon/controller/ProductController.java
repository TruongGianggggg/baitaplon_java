package com.gianglt.baitaplon.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gianglt.baitaplon.dto.CategoryBriefDto;
import com.gianglt.baitaplon.dto.PageResponse;
import com.gianglt.baitaplon.dto.ProductDto;
import com.gianglt.baitaplon.model.Category;
import com.gianglt.baitaplon.model.Product;
import com.gianglt.baitaplon.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private static final ObjectMapper M = new ObjectMapper();

    // ---------- Helpers (entity -> DTO) ----------
    private static ProductDto toDto(Product p) {
        List<String> details = Collections.emptyList();
        try {
            if (p.getDetailImages() != null && !p.getDetailImages().isBlank()) {
                details = M.readValue(p.getDetailImages(), new TypeReference<List<String>>() {});
            }
        } catch (Exception ignored) {}

        Category c = p.getCategory(); // LAZY proxy -> đọc vài field cơ bản
        CategoryBriefDto cat = null;
        if (c != null) {
            // Với OSIV mặc định của Spring Boot, đọc name/id ổn định.
            // Để chắc chắn hơn, các endpoint GET/SEARCH bên dưới có @Transactional(readOnly = true).
            cat = CategoryBriefDto.builder()
                    .id(c.getId())
                    .name(c.getName())
                    .build();
        }

        return ProductDto.builder()
                .id(p.getId())
                .name(p.getName())
                .slug(p.getSlug())
                .sku(p.getSku())
                .description(p.getDescription())
                .price(p.getPrice())
                .currency(p.getCurrency())
                .stock(p.getStock())
                .enabled(p.getEnabled())
                .category(cat)
                .coverImage(p.getCoverImage())
                .detailImages(details)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    // ---------- Endpoints ----------
    // Tạo sản phẩm + upload ảnh (multipart form)
    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<ProductDto> create(
            @RequestParam String name,
            @RequestParam String slug,
            @RequestParam String sku,
            @RequestParam(required = false) String description,
            @RequestParam BigDecimal price,
            @RequestParam(defaultValue = "VND") String currency,
            @RequestParam(defaultValue = "0") Integer stock,
            @RequestParam(defaultValue = "true") Boolean enabled,
            @RequestParam Long categoryId,
            @RequestParam(value = "cover", required = false) MultipartFile cover,
            @RequestParam(value = "details", required = false) List<MultipartFile> details
    ) {
        Product p = new Product();
        p.setName(name);
        p.setSlug(slug);
        p.setSku(sku);
        p.setDescription(description);
        p.setPrice(price);
        p.setCurrency(currency);
        p.setStock(stock);
        p.setEnabled(enabled);

        Product saved = productService.createWithImages(p, categoryId, cover, details);
        return ResponseEntity.ok(toDto(saved));
    }

    // Cập nhật sản phẩm + upload ảnh
    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<ProductDto> update(
            @PathVariable Long id,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String slug,
            @RequestParam(required = false) String sku,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) BigDecimal price,
            @RequestParam(required = false) String currency,
            @RequestParam(required = false) Integer stock,
            @RequestParam(required = false) Boolean enabled,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(value = "cover", required = false) MultipartFile cover,
            @RequestParam(value = "details", required = false) List<MultipartFile> details
    ) {
        Product patch = new Product();
        patch.setName(name);
        patch.setSlug(slug);
        patch.setSku(sku);
        patch.setDescription(description);
        patch.setPrice(price);
        patch.setCurrency(currency);
        patch.setStock(stock);
        patch.setEnabled(enabled);

        Product updated = productService.updateWithImages(id, patch, categoryId, cover, details);
        return ResponseEntity.ok(toDto(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // Đọc chi tiết (đảm bảo lazy an toàn khi toDto đọc category)
    @Transactional(readOnly = true)
    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> get(@PathVariable Long id) {
        return ResponseEntity.ok(toDto(productService.get(id)));
    }

    // Tìm kiếm + phân trang (trả JSON ổn định bằng PageResponse)
    @Transactional(readOnly = true)
    @GetMapping
    public ResponseEntity<PageResponse<ProductDto>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Boolean enabled,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,desc") String sort
    ) {
        String[] s = sort.split(",");
        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.fromString(s.length > 1 ? s[1] : "desc"), s[0]));

        Page<ProductDto> dtoPage = productService.search(
                keyword, categoryId, enabled, minPrice, maxPrice, inStock, pageable
        ).map(ProductController::toDto);

        return ResponseEntity.ok(PageResponse.from(dtoPage));
    }
}
