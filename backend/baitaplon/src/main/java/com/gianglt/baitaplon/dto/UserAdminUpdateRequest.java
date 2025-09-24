package com.gianglt.baitaplon.dto;

import com.gianglt.baitaplon.domain.Role;
import lombok.Data;

import java.util.Set;

@Data
public class UserAdminUpdateRequest {
    private String fullName;
    private String phone;

    private String addressLine1;
    private String addressLine2;
    private String ward;
    private String district;
    private String city;
    private String postalCode;
    private String country;

    private Set<Role> roles;     // optional: cập nhật vai trò
    private Boolean enabled;     // optional

    private String password;     // optional: đổi mật khẩu (DEV: plain)
}
