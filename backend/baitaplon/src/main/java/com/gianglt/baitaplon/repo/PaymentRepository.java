package com.gianglt.baitaplon.repo;

import com.gianglt.baitaplon.model.Order;
import com.gianglt.baitaplon.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByOrder(Order order);
    Optional<Payment> findByTxnRef(String txnRef);
    List<Payment> findAllByOrder_User_IdOrderByCreatedAtDesc(Long userId);

}
