package com.gianglt.baitaplon.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "pay.vnpay")
@Getter @Setter
public class VnpayConfig {
    private String tmnCode;
    private String secretKey;
    private String payUrl;
    private String returnUrl;
    private String ipnUrl;
    private String version;
    private String currCode;
    private String locale;
    private String orderType;
    private Integer expireMinutes;
}
