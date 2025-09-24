package com.gianglt.baitaplon.repo;

import com.gianglt.baitaplon.model.Coupon;
import com.gianglt.baitaplon.model.CouponRedemption;
import com.gianglt.baitaplon.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CouponRedemptionRepository extends JpaRepository<CouponRedemption, Long> {
    long countByCoupon(Coupon coupon);
    long countByCouponAndUser(Coupon coupon, User user);
}
