package com.gianglt.baitaplon.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class RegisterRequest {
    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String password;

    private String fullName;

//    @NotBlank private String fullName;
//    @NotBlank private String phone;
//
//    @NotBlank private String addressLine1;
//    private String addressLine2;
//    private String ward;
//    private String district;
//    @NotBlank private String city;
//    private String postalCode;
//    private String country = "VN";
}
