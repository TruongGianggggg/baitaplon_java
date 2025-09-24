package com.gianglt.baitaplon.controller;

import com.gianglt.baitaplon.model.Cart;
import com.gianglt.baitaplon.model.Coupon;
import com.gianglt.baitaplon.model.User;
import com.gianglt.baitaplon.repo.CartRepository;
import com.gianglt.baitaplon.repo.UserRepository;
import com.gianglt.baitaplon.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;
    private final UserRepository userRepo;
    private final CartRepository cartRepo;

    private User user(Long userId) {
        return userRepo.findById(userId).orElseThrow(() -> new NoSuchElementException("Không tìm thấy user"));
    }
    private Cart cart(User u) {
        return cartRepo.findByUser(u).orElseThrow(() -> new NoSuchElementException("Giỏ hàng trống"));
    }

    @GetMapping
    public ResponseEntity<List<Coupon>> getAll() {
        return ResponseEntity.ok(couponService.getAll());
    }

    @PostMapping
    public ResponseEntity<Coupon> create(@RequestBody Coupon c) {
        return ResponseEntity.ok(couponService.create(c));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Coupon> update(@PathVariable Long id, @RequestBody Coupon patch) {
        return ResponseEntity.ok(couponService.update(id, patch));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        couponService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Coupon> get(@PathVariable Long id) {
        return ResponseEntity.ok(couponService.get(id));
    }

    // Preview áp mã (không ghi DB)
    @PostMapping("/preview")
    public ResponseEntity<Map<String, Object>> preview(@RequestParam String code, @RequestParam Long userId) {
        User u = user(userId);
        Cart c = cart(u);
        return ResponseEntity.ok(couponService.preview(code, u, c));
    }

    // Redeem (ghi nhận sử dụng), thường gọi khi checkout thành công, truyền orderId nếu có
    @PostMapping("/redeem")
    public ResponseEntity<Map<String, Object>> redeem(@RequestParam String code,
                                                      @RequestParam Long userId,
                                                      @RequestParam(required = false) Long orderId) {
        User u = user(userId);
        Cart c = cart(u);
        BigDecimal discount = couponService.redeem(code, u, c, orderId);
        return ResponseEntity.ok(Map.of("couponCode", code, "discount", discount));
    }
}
