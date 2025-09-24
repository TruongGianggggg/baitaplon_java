package com.gianglt.baitaplon.dto;

import com.gianglt.baitaplon.domain.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.Set;

@Data
public class UserAdminCreateRequest {
    @NotBlank @Email
    private String email;

    @NotBlank
    private String password;

    private String fullName;
    private String phone;

    // địa chỉ (optional)
    private String addressLine1;
    private String addressLine2;
    private String ward;
    private String district;
    private String city;
    private String postalCode;
    private String country;

    // defaults
    private Set<Role> roles;
    private Boolean enabled;
}
