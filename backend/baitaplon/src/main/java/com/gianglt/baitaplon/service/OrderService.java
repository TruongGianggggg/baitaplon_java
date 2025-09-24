package com.gianglt.baitaplon.service;

import com.gianglt.baitaplon.dto.OrderDto;
import com.gianglt.baitaplon.model.Order;
import com.gianglt.baitaplon.dto.CheckoutRequest;

import java.util.List;
import java.util.Map;

public interface OrderService {
    Map<String, Object> checkout(CheckoutRequest req);
    OrderDto get(Long id);
    List<OrderDto> getAll();
    List<OrderDto> getByUserId(Long userId);

}
