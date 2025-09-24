package com.gianglt.baitaplon.repo;

import com.gianglt.baitaplon.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

}
