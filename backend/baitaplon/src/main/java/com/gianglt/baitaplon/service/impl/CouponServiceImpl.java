package com.gianglt.baitaplon.service.impl;

import com.gianglt.baitaplon.model.*;
import com.gianglt.baitaplon.repo.CouponRedemptionRepository;
import com.gianglt.baitaplon.repo.CouponRepository;
import com.gianglt.baitaplon.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepo;
    private final CouponRedemptionRepository redemptionRepo;


    @Override
    public List<Coupon> getAll() {
        return couponRepo.findAll();
    }

    @Override @Transactional
    public Coupon create(Coupon c) {
        if (c.getEnabled() == null) c.setEnabled(true);
        if (c.getUsedCount() == null) c.setUsedCount(0);
        if (c.getMinOrderAmount() == null) c.setMinOrderAmount(BigDecimal.ZERO);
        return couponRepo.save(c);
    }

    @Override @Transactional
    public Coupon update(Long id, Coupon patch) {
        Coupon c = get(id);
        if (patch.getCode() != null) c.setCode(patch.getCode());
        if (patch.getName() != null) c.setName(patch.getName());
        if (patch.getDescription() != null) c.setDescription(patch.getDescription());
        if (patch.getDiscountType() != null) c.setDiscountType(patch.getDiscountType());
        if (patch.getDiscountValue() != null) c.setDiscountValue(patch.getDiscountValue());
        if (patch.getMaxDiscountAmount() != null) c.setMaxDiscountAmount(patch.getMaxDiscountAmount());
        if (patch.getMinOrderAmount() != null) c.setMinOrderAmount(patch.getMinOrderAmount());
        if (patch.getTargetType() != null) c.setTargetType(patch.getTargetType());
        if (patch.getEnabled() != null) c.setEnabled(patch.getEnabled());
        if (patch.getStartsAt() != null) c.setStartsAt(patch.getStartsAt());
        if (patch.getEndsAt() != null) c.setEndsAt(patch.getEndsAt());
        if (patch.getTotalQuantity() != null) c.setTotalQuantity(patch.getTotalQuantity());
        if (patch.getPerUserLimit() != null) c.setPerUserLimit(patch.getPerUserLimit());
        if (patch.getStackable() != null) c.setStackable(patch.getStackable());

        // cập nhật target sets nếu truyền vào
        if (patch.getTargetType() == Coupon.TargetType.CATEGORY && patch.getCategories() != null) {
            c.getCategories().clear();
            c.getCategories().addAll(patch.getCategories());
        }
        if (patch.getTargetType() == Coupon.TargetType.PRODUCT && patch.getProducts() != null) {
            c.getProducts().clear();
            c.getProducts().addAll(patch.getProducts());
        }
        return c;
    }

    @Override
    public void delete(Long id) {
        couponRepo.deleteById(id);
    }

    @Override
    public Coupon get(Long id) {
        return couponRepo.findById(id).orElseThrow(() -> new NoSuchElementException("Không tìm thấy coupon"));
    }

    // ---------- Core logic ----------

    @Override
    public Map<String, Object> preview(String code, User user, Cart cart) {
        Coupon coupon = couponRepo.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new NoSuchElementException("Mã không tồn tại"));

        validateCouponUsable(coupon, user, cart);

        BigDecimal eligibleAmount = calcEligibleAmount(coupon, cart);
        BigDecimal discount = calcDiscount(coupon, eligibleAmount);

        BigDecimal subtotal = calcCartSubtotal(cart);
        if (coupon.getMinOrderAmount() != null &&
                subtotal.compareTo(coupon.getMinOrderAmount()) < 0) {
            throw new IllegalArgumentException("Chưa đạt giá trị đơn tối thiểu");
        }

        BigDecimal newTotal = subtotal.subtract(discount);
        if (newTotal.compareTo(BigDecimal.ZERO) < 0) newTotal = BigDecimal.ZERO;

        return Map.of(
                "couponCode", coupon.getCode(),
                "discount", discount,
                "subtotal", subtotal,
                "totalAfterDiscount", newTotal
        );
    }

    @Override @Transactional
    public BigDecimal redeem(String code, User user, Cart cart, Long orderId) {
        Map<String, Object> p = preview(code, user, cart);
        BigDecimal discount = (BigDecimal) p.get("discount");
        if (discount.compareTo(BigDecimal.ZERO) <= 0) return BigDecimal.ZERO;

        Coupon coupon = couponRepo.findByCodeIgnoreCase(code).orElseThrow();
        // Ghi nhận redemption
        CouponRedemption r = CouponRedemption.builder()
                .coupon(coupon)
                .user(user)
                .orderId(orderId)
                .discountAmount(discount)
                .build();
        redemptionRepo.save(r);

        // tăng usedCount (nếu có giới hạn tổng)
        if (coupon.getTotalQuantity() != null) {
            coupon.setUsedCount(Optional.ofNullable(coupon.getUsedCount()).orElse(0) + 1);
        }
        return discount;
    }

    // ---------- Helpers ----------

    private void validateCouponUsable(Coupon coupon, User user, Cart cart) {
        if (coupon.getEnabled() == null || !coupon.getEnabled()) {
            throw new IllegalArgumentException("Mã đã bị tắt");
        }
        Instant now = Instant.now();
        if (coupon.getStartsAt() != null && now.isBefore(coupon.getStartsAt())) {
            throw new IllegalArgumentException("Mã chưa đến thời gian sử dụng");
        }
        if (coupon.getEndsAt() != null && now.isAfter(coupon.getEndsAt())) {
            throw new IllegalArgumentException("Mã đã hết hạn");
        }
        if (coupon.getTotalQuantity() != null) {
            long used = redemptionRepo.countByCoupon(coupon);
            if (used >= coupon.getTotalQuantity()) {
                throw new IllegalArgumentException("Mã đã hết lượt sử dụng");
            }
        }
        if (coupon.getPerUserLimit() != null && coupon.getPerUserLimit() > 0) {
            long userUsed = redemptionRepo.countByCouponAndUser(coupon, user);
            if (userUsed >= coupon.getPerUserLimit()) {
                throw new IllegalArgumentException("Bạn đã dùng mã này đủ số lần cho phép");
            }
        }
        // minOrderAmount check được thực hiện ở preview dựa trên subtotal
        if (cart == null || cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new IllegalArgumentException("Giỏ hàng trống");
        }
    }

    private BigDecimal calcEligibleAmount(Coupon coupon, Cart cart) {
        switch (coupon.getTargetType()) {
            case ALL:
                return calcCartSubtotal(cart);
            case CATEGORY:
                Set<Long> catIds = coupon.getCategories() == null ? Set.of() :
                        coupon.getCategories().stream().map(Category::getId).collect(java.util.stream.Collectors.toSet());
                return cart.getItems().stream()
                        .filter(i -> i.getProduct() != null && i.getProduct().getCategory() != null
                                && catIds.contains(i.getProduct().getCategory().getId()))
                        .map(i -> i.getPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
            case PRODUCT:
                Set<Long> prodIds = coupon.getProducts() == null ? Set.of() :
                        coupon.getProducts().stream().map(Product::getId).collect(java.util.stream.Collectors.toSet());
                return cart.getItems().stream()
                        .filter(i -> i.getProduct() != null && prodIds.contains(i.getProduct().getId()))
                        .map(i -> i.getPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
            default:
                return BigDecimal.ZERO;
        }
    }

    private BigDecimal calcDiscount(Coupon coupon, BigDecimal eligibleAmount) {
        if (eligibleAmount.compareTo(BigDecimal.ZERO) <= 0) return BigDecimal.ZERO;

        BigDecimal discount;
        if (coupon.getDiscountType() == Coupon.DiscountType.PERCENT) {
            BigDecimal percent = coupon.getDiscountValue(); // ví dụ 10 = 10%
            discount = eligibleAmount.multiply(percent).divide(BigDecimal.valueOf(100));
            if (coupon.getMaxDiscountAmount() != null &&
                    discount.compareTo(coupon.getMaxDiscountAmount()) > 0) {
                discount = coupon.getMaxDiscountAmount();
            }
        } else { // FIXED
            discount = coupon.getDiscountValue();
            if (discount.compareTo(eligibleAmount) > 0) discount = eligibleAmount;
        }
        return discount;
    }

    private BigDecimal calcCartSubtotal(Cart cart) {
        return cart.getItems().stream()
                .map(i -> i.getPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
