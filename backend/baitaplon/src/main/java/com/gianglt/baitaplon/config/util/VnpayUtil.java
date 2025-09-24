package com.gianglt.baitaplon.config.util;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

public final class VnpayUtil {
    private VnpayUtil() {}

    public static String hmacSHA512(String key, String data) {
        try {
            if (key == null || key.isBlank()) {
                throw new IllegalArgumentException("VNPAY secretKey is missing!");
            }
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac512.init(secretKeySpec);
            byte[] bytes = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hash = new StringBuilder();
            for (byte b : bytes) hash.append(String.format("%02x", b));
            return hash.toString();
        } catch (Exception e) {
            throw new RuntimeException("HMAC SHA512 error", e);
        }
    }

    public static String buildSignData(Map<String, String> params) {
        List<String> keys = new ArrayList<>(params.keySet());
        Collections.sort(keys);
        StringBuilder sb = new StringBuilder();
        boolean first = true;
        for (String k : keys) {
            String v = params.get(k);
            if (v == null || v.isEmpty()) continue;
            if (!first) sb.append('&');
            sb.append(k).append('=').append(v);
            first = false;
        }
        return sb.toString();
    }

    public static String buildUrlQuery(Map<String, String> params) {
        List<String> keys = new ArrayList<>(params.keySet());
        Collections.sort(keys);
        StringBuilder sb = new StringBuilder();
        boolean first = true;
        for (String k : keys) {
            String v = params.get(k);
            if (v == null || v.isEmpty()) continue;
            if (!first) sb.append('&');
            sb.append(URLEncoder.encode(k, StandardCharsets.UTF_8))
                    .append('=')
                    .append(URLEncoder.encode(v, StandardCharsets.UTF_8));
            first = false;
        }
        return sb.toString();
    }

    public static boolean validateSignature(Map<String, String> allParams, String secretKey) {
        String receivedHash = allParams.getOrDefault("vnp_SecureHash", "");
        Map<String, String> data = new HashMap<>(allParams);
        data.remove("vnp_SecureHash");
        data.remove("vnp_SecureHashType");

        String signData = buildSignData(data);
        String calc = hmacSHA512(secretKey, signData);
        return calc.equalsIgnoreCase(receivedHash);
    }
}
