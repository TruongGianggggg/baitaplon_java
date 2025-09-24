package com.gianglt.baitaplon.service.impl;

import com.gianglt.baitaplon.config.VnpayConfig;
import com.gianglt.baitaplon.domain.OrderStatus;
import com.gianglt.baitaplon.domain.PaymentMethod;
import com.gianglt.baitaplon.domain.PaymentStatus;
import com.gianglt.baitaplon.dto.PaymentDto;
import com.gianglt.baitaplon.model.Order;
import com.gianglt.baitaplon.model.Payment;
import com.gianglt.baitaplon.repo.OrderRepository;
import com.gianglt.baitaplon.repo.PaymentRepository;
import com.gianglt.baitaplon.service.PaymentService;
import com.gianglt.baitaplon.config.util.VnpayUtil; // giữ nguyên import util hiện có (chỉ dùng HMAC + buildUrlQuery)
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final VnpayConfig props;
    private final PaymentRepository paymentRepo;
    private final OrderRepository orderRepo;

    private static final DateTimeFormatter VNP_FMT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");


    // ====== GET DTOs (không @Query) ======
    @Override
    @Transactional(readOnly = true)
    public List<PaymentDto> getAllDto() {
        return paymentRepo.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<PaymentDto> getDtoById(Long id) {
        return paymentRepo.findById(id).map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentDto> getByUserIdDto(Long userId) {
        return paymentRepo.findAllByOrder_User_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toDto)
                .toList();
    }


    private PaymentDto toDto(Payment p) {
        Long orderId = (p.getOrder() != null ? p.getOrder().getId() : null); // có thể cần fetch nếu LAZY
        return PaymentDto.builder()
                .id(p.getId())
                .orderId(orderId)
                .method(p.getMethod())
                .status(p.getStatus())
                .provider(p.getProvider())
                .amount(p.getAmount())
                .txnRef(p.getTxnRef())
                .bankCode(p.getBankCode())
                .bankTranNo(p.getBankTranNo())
                .transactionNo(p.getTransactionNo())
                .responseCode(p.getResponseCode())
                .orderInfo(p.getOrderInfo())
                .payDate(p.getPayDate())
                .createdAt(p.getCreatedAt())
                .build();
    }


    private void assertConfig() {
        if (props.getSecretKey() == null || props.getSecretKey().isBlank())
            throw new IllegalStateException("pay.vnpay.secretKey is missing");
        if (props.getTmnCode() == null || props.getTmnCode().isBlank())
            throw new IllegalStateException("pay.vnpay.tmnCode is missing");
        if (props.getPayUrl() == null || props.getPayUrl().isBlank())
            throw new IllegalStateException("pay.vnpay.payUrl is missing");
        if (props.getReturnUrl() == null || props.getReturnUrl().isBlank())
            throw new IllegalStateException("pay.vnpay.returnUrl is missing");
    }

    @Override
    @Transactional
    public String buildVnpayUrl(Order order, String clientIp) {
        assertConfig();
        if (order == null) throw new IllegalArgumentException("Order null");
        if (order.getPaymentMethod() != PaymentMethod.VNPAY) {
            throw new IllegalStateException("Order không phải phương thức VNPAY");
        }

        // txnRef duy nhất
        String txnRef = genTxnRef(order.getId());

        // Gắn hoặc tạo Payment
        Payment payment = order.getPayment();
        if (payment == null) {
            payment = Payment.builder()
                    .order(order)
                    .method(PaymentMethod.VNPAY)
                    .provider("VNPAY")
                    .status(PaymentStatus.PENDING)
                    .amount(order.getTotalAmount())
                    .build();
        }
        payment.setTxnRef(txnRef);
        paymentRepo.save(payment);

        // Tham số gửi VNPAY
        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", props.getVersion());
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", props.getTmnCode());

        // amount × 100 (VND)
        String amount = order.getTotalAmount()
                .multiply(BigDecimal.valueOf(100L))
                .toBigInteger().toString();
        vnpParams.put("vnp_Amount", amount);
        vnpParams.put("vnp_CurrCode", props.getCurrCode());
        vnpParams.put("vnp_TxnRef", txnRef);
        vnpParams.put("vnp_OrderInfo", "Order#" + order.getId());
        vnpParams.put("vnp_OrderType", props.getOrderType());
        vnpParams.put("vnp_Locale", props.getLocale());
        vnpParams.put("vnp_ReturnUrl", props.getReturnUrl());
        vnpParams.put("vnp_IpAddr", clientIp != null ? clientIp : "127.0.0.1");

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expire = now.plusMinutes(props.getExpireMinutes());
        vnpParams.put("vnp_CreateDate", now.format(VNP_FMT));
        vnpParams.put("vnp_ExpireDate", expire.format(VNP_FMT));

        // ===== SIGN (kiểu ENCODE — đúng sample VNPAY) =====
        // Không đưa vnp_SecureHash/vnp_SecureHashType vào signData
        String signData = buildSignDataEncoded(vnpParams); // encode key & value, sort ASC, nối k=v bằng '&'
        String secureHash = VnpayUtil.hmacSHA512(props.getSecretKey(), signData).toUpperCase();

        // Lên URL: encode + gắn SecureHashType & SecureHash
        vnpParams.put("vnp_SecureHashType", "HMACSHA512"); // chỉ gắn lên URL, không ký
        String queryEncoded = buildUrlQueryEncoded(vnpParams);
        String url = props.getPayUrl() + "?" + queryEncoded + "&vnp_SecureHash=" + secureHash;

        // Debug nhanh (xem log server để so sánh nếu còn sai)
        System.out.println("[VNP SIGNDATA] " + signData);
        System.out.println("[VNP HASH] " + secureHash);
        System.out.println("[VNP URL] " + url);

        return url;
    }

    @Override
    @Transactional
    public Map<String, Object> handleVnpayReturn(Map<String, String> params) {
        Map<String, Object> res = new LinkedHashMap<>();
        if (!verifyVnpSignatureEncoded(params)) { // verify theo công thức ENCODE
            res.put("success", false);
            res.put("message", "Sai chữ ký");
            return res;
        }

        String txnRef = params.get("vnp_TxnRef");
        String rspCode = params.get("vnp_ResponseCode");

        Payment payment = paymentRepo.findByTxnRef(txnRef).orElseThrow();
        Order order = payment.getOrder();

        if ("00".equals(rspCode)) {
            payment.setStatus(PaymentStatus.PAID);
            order.setStatus(OrderStatus.NEW);
        } else {
            payment.setStatus(PaymentStatus.FAILED);
        }

        payment.setResponseCode(rspCode);
        paymentRepo.save(payment);
        orderRepo.save(order);

        res.put("success", "00".equals(rspCode));
        res.put("orderId", order.getId());
        res.put("paymentStatus", payment.getStatus());
        res.put("orderStatus", order.getStatus());
        return res;
    }

    @Override
    @Transactional
    public String handleVnpayIpn(Map<String, String> params) {
        if (!verifyVnpSignatureEncoded(params)) { // verify theo công thức ENCODE
            return "{\"RspCode\":\"97\",\"Message\":\"Invalid signature\"}";
        }

        String txnRef = params.get("vnp_TxnRef");
        String rspCode = params.get("vnp_ResponseCode");

        Payment payment = paymentRepo.findByTxnRef(txnRef).orElseThrow();
        Order order = payment.getOrder();

        if ("00".equals(rspCode)) {
            payment.setStatus(PaymentStatus.PAID);
            order.setStatus(OrderStatus.NEW);
            paymentRepo.save(payment);
            orderRepo.save(order);
            return "{\"RspCode\":\"00\",\"Message\":\"Confirm Success\"}";
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepo.save(payment);
            return "{\"RspCode\":\"00\",\"Message\":\"Confirm Failed\"}";
        }
    }

    private String genTxnRef(Long orderId) {
        return orderId + "-" + System.currentTimeMillis();
    }

    // ================= Helpers (ký/verify kiểu ENCODE) =================

    /** Build signData: sort keys ASC, URL-encode key & value, nối k=v bằng '&' (KHÔNG có vnp_SecureHash/Type). */
    private String buildSignDataEncoded(Map<String, String> params) {
        List<String> keys = new ArrayList<>(params.keySet());
        Collections.sort(keys);
        StringBuilder sb = new StringBuilder();
        boolean first = true;
        for (String k : keys) {
            String v = params.get(k);
            if (v == null || v.isEmpty()) continue;
            if ("vnp_SecureHash".equals(k) || "vnp_SecureHashType".equals(k)) continue;
            if (!first) sb.append('&');
            sb.append(urlEncode(k)).append('=').append(urlEncode(v));
            first = false;
        }
        return sb.toString();
    }

    /** Build query để đưa lên URL: sort + URL-encode key & value, KHÔNG kèm vnp_SecureHash. */
    private String buildUrlQueryEncoded(Map<String, String> params) {
        List<String> keys = new ArrayList<>(params.keySet());
        Collections.sort(keys);
        StringBuilder sb = new StringBuilder();
        boolean first = true;
        for (String k : keys) {
            String v = params.get(k);
            if (v == null || v.isEmpty()) continue;
            if ("vnp_SecureHash".equals(k)) continue; // hash nối ở cuối
            if (!first) sb.append('&');
            sb.append(urlEncode(k)).append('=').append(urlEncode(v));
            first = false;
        }
        return sb.toString();
    }

    private boolean verifyVnpSignatureEncoded(Map<String, String> allParams) {
        String received = allParams.get("vnp_SecureHash");
        if (received == null || received.isEmpty()) return false;
        Map<String, String> data = new HashMap<>(allParams);
        data.remove("vnp_SecureHash");
        // vnp_SecureHashType có thể có/không — nếu có thì bỏ ra
        data.remove("vnp_SecureHashType");
        String signData = buildSignDataEncoded(data);
        String calc = VnpayUtil.hmacSHA512(props.getSecretKey(), signData).toUpperCase();
        return calc.equalsIgnoreCase(received);
    }

    private String urlEncode(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }
}
