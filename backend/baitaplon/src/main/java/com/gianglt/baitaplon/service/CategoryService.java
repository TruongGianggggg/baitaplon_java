package com.gianglt.baitaplon.service;

import com.gianglt.baitaplon.model.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CategoryService {
    Category create(Category c);
    Category update(Long id, Category patch);
    void delete(Long id);
    Category get(Long id);
    Page<Category> list(String keyword, Boolean enabled, Pageable pageable);
}
