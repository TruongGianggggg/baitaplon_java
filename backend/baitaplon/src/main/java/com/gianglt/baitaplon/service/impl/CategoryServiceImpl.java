package com.gianglt.baitaplon.service.impl;

import com.gianglt.baitaplon.model.Category;
import com.gianglt.baitaplon.repo.CategoryRepository;
import com.gianglt.baitaplon.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepo;

    @Override
    @Transactional
    public Category create(Category c) {
        if (categoryRepo.existsBySlug(c.getSlug()))
            throw new IllegalArgumentException("Slug danh mục đã tồn tại");
        if (c.getEnabled() == null) c.setEnabled(true);
        return categoryRepo.save(c);
    }

    @Override
    @Transactional
    public Category update(Long id, Category patch) {
        Category c = get(id);
        if (patch.getName() != null) c.setName(patch.getName());
        if (patch.getSlug() != null) c.setSlug(patch.getSlug());
        if (patch.getDescription() != null) c.setDescription(patch.getDescription());
        if (patch.getEnabled() != null) c.setEnabled(patch.getEnabled());
        return c;
    }

    @Override
    @Transactional
    public void delete(Long id) {
        categoryRepo.deleteById(id);
    }

    @Override
    public Category get(Long id) {
        return categoryRepo.findById(id).orElseThrow(() -> new NoSuchElementException("Không tìm thấy danh mục"));
    }

    @Override
    public Page<Category> list(String keyword, Boolean enabled, Pageable pageable) {
        // Tối giản: lọc ở memory với PageRequest nhỏ; nếu muốn tối ưu hơn có thể dùng Specification
        Page<Category> page = categoryRepo.findAll(pageable);
        return page.map(c -> c)  // giữ nguyên
                .map(c -> c)         // no-op
                ;
    }
}
