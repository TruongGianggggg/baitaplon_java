package com.gianglt.baitaplon.service;

import com.gianglt.baitaplon.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

public interface ProductService {
    Product createWithImages(Product p, Long categoryId, MultipartFile cover, List<MultipartFile> details);
    Product updateWithImages(Long id, Product patch, Long categoryId, MultipartFile cover, List<MultipartFile> details);
    void delete(Long id);
    Product get(Long id);

    Page<Product> search(String keyword, Long categoryId, Boolean enabled,
                         BigDecimal minPrice, BigDecimal maxPrice, Boolean inStock,
                         Pageable pageable);
}
