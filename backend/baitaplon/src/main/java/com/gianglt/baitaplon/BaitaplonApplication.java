package com.gianglt.baitaplon;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class BaitaplonApplication {

    public static void main(String[] args) {
        SpringApplication.run(BaitaplonApplication.class, args);
    }

}
