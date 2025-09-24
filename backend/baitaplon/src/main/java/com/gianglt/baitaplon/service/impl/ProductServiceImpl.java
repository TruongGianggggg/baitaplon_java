package com.gianglt.baitaplon.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gianglt.baitaplon.model.Category;
import com.gianglt.baitaplon.model.Product;
import com.gianglt.baitaplon.repo.CategoryRepository;
import com.gianglt.baitaplon.repo.ProductRepository;
import com.gianglt.baitaplon.service.ProductService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepo;
    private final CategoryRepository categoryRepo;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    @Transactional
    public Product createWithImages(Product p, Long categoryId, MultipartFile cover, List<MultipartFile> details) {
        if (productRepo.existsBySku(p.getSku())) throw new IllegalArgumentException("SKU đã tồn tại");
        if (productRepo.existsBySlug(p.getSlug())) throw new IllegalArgumentException("Slug đã tồn tại");

        Category c = categoryRepo.findById(categoryId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy danh mục"));
        p.setCategory(c);

        if (p.getCurrency() == null) p.setCurrency("VND");
        if (p.getEnabled() == null)  p.setEnabled(true);
        if (p.getStock() == null)    p.setStock(0);

        // Lưu ảnh
        if (cover != null && !cover.isEmpty()) {
            p.setCoverImage(saveFileAndReturnUrl(cover));
        }
        if (details != null && !details.isEmpty()) {
            List<String> urls = new ArrayList<>();
            for (MultipartFile f : details) {
                urls.add(saveFileAndReturnUrl(f));
            }
            p.setDetailImages(writeDetailImages(urls));
        }

        return productRepo.save(p);
    }

    @Override
    @Transactional
    public Product updateWithImages(Long id, Product patch, Long categoryId, MultipartFile cover, List<MultipartFile> details) {
        Product p = get(id);

        if (patch.getName() != null) p.setName(patch.getName());
        if (patch.getSlug() != null) p.setSlug(patch.getSlug());
        if (patch.getSku() != null)  p.setSku(patch.getSku());
        if (patch.getDescription() != null) p.setDescription(patch.getDescription());
        if (patch.getPrice() != null) p.setPrice(patch.getPrice());
        if (patch.getCurrency() != null) p.setCurrency(patch.getCurrency());
        if (patch.getStock() != null) p.setStock(patch.getStock());
        if (patch.getEnabled() != null) p.setEnabled(patch.getEnabled());

        if (categoryId != null) {
            Category c = categoryRepo.findById(categoryId)
                    .orElseThrow(() -> new NoSuchElementException("Không tìm thấy danh mục"));
            p.setCategory(c);
        }

        if (cover != null && !cover.isEmpty()) {
            p.setCoverImage(saveFileAndReturnUrl(cover));
        }
        if (details != null && !details.isEmpty()) {
            List<String> urls = new ArrayList<>();
            for (MultipartFile f : details) {
                urls.add(saveFileAndReturnUrl(f));
            }
            p.setDetailImages(writeDetailImages(urls));
        }

        return p;
    }

    @Override
    @Transactional
    public void delete(Long id) {
        productRepo.deleteById(id);
    }

    @Override
    public Product get(Long id) {
        return productRepo.findById(id).orElseThrow(() -> new NoSuchElementException("Không tìm thấy sản phẩm"));
    }

    @Override
    public Page<Product> search(String keyword, Long categoryId, Boolean enabled,
                                BigDecimal minPrice, BigDecimal maxPrice, Boolean inStock,
                                Pageable pageable) {

        Specification<Product> spec = (root, query, cb) -> {
            var predicates = new ArrayList<Predicate>();

            if (keyword != null && !keyword.isBlank()) {
                String like = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), like),
                        cb.like(cb.lower(root.get("description")), like),
                        cb.like(cb.lower(root.get("sku")), like)
                ));
            }
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }
            if (enabled != null) {
                predicates.add(cb.equal(root.get("enabled"), enabled));
            }
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }
            if (inStock != null) {
                predicates.add(Boolean.TRUE.equals(inStock)
                        ? cb.greaterThan(root.get("stock"), 0)
                        : cb.lessThanOrEqualTo(root.get("stock"), 0));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return productRepo.findAll(spec, pageable);
    }

    // --------- Helpers ---------
    private String saveFileAndReturnUrl(MultipartFile file) {
        try {
            Path dirPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(dirPath);

            String original = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
            String ext = "";
            int idx = original.lastIndexOf(".");
            if (idx > 0) ext = original.substring(idx);

            String filename = UUID.randomUUID() + ext;
            Path target = dirPath.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Không thể lưu file: " + e.getMessage(), e);
        }
    }

    private String writeDetailImages(List<String> list) {
        try {
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) {
            throw new RuntimeException("Không thể ghi detailImages JSON");
        }
    }
}
