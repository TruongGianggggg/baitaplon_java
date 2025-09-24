package com.gianglt.baitaplon.service;

import com.gianglt.baitaplon.dto.PaymentDto;
import com.gianglt.baitaplon.model.Order;
import com.gianglt.baitaplon.model.Payment;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface PaymentService {
    String buildVnpayUrl(Order order, String clientIp);
    Map<String, Object> handleVnpayReturn(Map<String, String> params);
    String handleVnpayIpn(Map<String, String> params);

//    List<Payment> getAll();                // trả toàn bộ payments
//    Optional<Payment> getById(Long id);


    List<PaymentDto> getAllDto();
    Optional<PaymentDto> getDtoById(Long id);
    List<PaymentDto> getByUserIdDto(Long userId);

}
