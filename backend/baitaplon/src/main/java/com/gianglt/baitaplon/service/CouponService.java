package com.gianglt.baitaplon.service;

import com.gianglt.baitaplon.model.Cart;
import com.gianglt.baitaplon.model.Coupon;
import com.gianglt.baitaplon.model.User;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public interface CouponService {
    List<Coupon> getAll();
    Coupon create(Coupon c);
    Coupon update(Long id, Coupon patch);
    void delete(Long id);
    Coupon get(Long id);

    /**
     * Preview áp mã giảm giá lên giỏ hàng: tính số tiền giảm và tổng mới.
     * Không ghi nhận redemption vào DB.
     */
    Map<String, Object> preview(String code, User user, Cart cart);

    /**
     * Áp mã và GHI NHẬN redemption (dùng khi checkout thành công).
     * Trả về số tiền giảm đã áp.
     */
    BigDecimal redeem(String code, User user, Cart cart, Long orderId);
}
