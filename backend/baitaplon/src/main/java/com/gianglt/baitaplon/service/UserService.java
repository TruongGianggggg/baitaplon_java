package com.gianglt.baitaplon.service;

import com.gianglt.baitaplon.dto.UserAdminCreateRequest;
import com.gianglt.baitaplon.dto.UserAdminUpdateRequest;
import com.gianglt.baitaplon.model.User;
import com.gianglt.baitaplon.dto.LoginRequest;
import com.gianglt.baitaplon.dto.RegisterRequest;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface UserService {
    Map<String, Object> register(RegisterRequest req);
    Map<String, Object> login(LoginRequest req);
    User getById(Long id);
    User updateBasic(Long id, User patch);

    Optional<User> findByEmail(String email);


    // ===== Admin CRUD (no paging) =====
    List<User> search(String q);
    User adminCreate(UserAdminCreateRequest req);
//    User adminUpdate(Long id, UserAdminUpdateRequest req);
    void adminDelete(Long id);
}
