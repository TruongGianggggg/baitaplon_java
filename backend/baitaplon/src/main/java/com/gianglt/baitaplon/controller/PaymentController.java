// src/main/java/.../controller/PaymentController.java
package com.gianglt.baitaplon.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gianglt.baitaplon.dto.PaymentDto;
import com.gianglt.baitaplon.model.Payment;
import com.gianglt.baitaplon.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final ObjectMapper objectMapper; // <-- thêm dòng này


    // FE (payment-success.component) sẽ gọi endpoint này với toàn bộ query params VNPAY
    @GetMapping(value = "/vnpay-return", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String,Object>> vnpayReturn(@RequestParam Map<String,String> allParams) {
        // Yêu cầu service trả về Map có: success(boolean), message(String), orderId(Long) (+ optional fields)
        Map<String,Object> result = paymentService.handleVnpayReturn(allParams);
        return ResponseEntity.ok(result);
    }

    // IPN của VNPAY (máy chủ VNPAY gọi) – phải trả ra "OK" / "INVALID" theo chuẩn VNPAY
    @GetMapping("/vnpay-ipn")
    public ResponseEntity<String> vnpayIpn(@RequestParam Map<String,String> allParams) {
        String resp = paymentService.handleVnpayIpn(allParams);
        return ResponseEntity.ok(resp);
    }

    // ✅ Trả danh sách PaymentDto
    @GetMapping
    public ResponseEntity<List<PaymentDto>> getAll() {
        return ResponseEntity.ok(paymentService.getAllDto());
    }

    // ✅ Trả PaymentDto theo id
    @GetMapping("/{id}")
    public ResponseEntity<PaymentDto> getById(@PathVariable Long id) {
        return paymentService.getDtoById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/me")
    public ResponseEntity<List<PaymentDto>> myPayments(@AuthenticationPrincipal(expression = "id") Long userId) {
        return ResponseEntity.ok(paymentService.getByUserIdDto(userId));
    }

}


