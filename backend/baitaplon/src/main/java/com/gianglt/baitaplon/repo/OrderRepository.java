package com.gianglt.baitaplon.repo;

import com.gianglt.baitaplon.model.Order;
import com.gianglt.baitaplon.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserOrderByCreatedAtDesc(User user);

}
