package com.gianglt.baitaplon.repo;


import com.gianglt.baitaplon.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, Long> { }
