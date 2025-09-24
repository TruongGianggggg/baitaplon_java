package com.gianglt.baitaplon.service.impl;

import com.gianglt.baitaplon.config.jwt.JwtUtils;
import com.gianglt.baitaplon.domain.Role;
import com.gianglt.baitaplon.dto.LoginRequest;
import com.gianglt.baitaplon.dto.RegisterRequest;
import com.gianglt.baitaplon.dto.UserAdminCreateRequest;
import com.gianglt.baitaplon.dto.UserAdminUpdateRequest;
import com.gianglt.baitaplon.model.User;
import com.gianglt.baitaplon.repo.UserRepository;
import com.gianglt.baitaplon.service.UserService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepo;
    private final JwtUtils jwtUtils;

    @Override
    @Transactional
    public Map<String, Object> register(RegisterRequest req) {
        if (userRepo.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email đã tồn tại");
        }
        User u = User.builder()
                .email(req.getEmail())
                .password(req.getPassword()) // *** KHÔNG mã hóa (chỉ DEV/test) ***
                .fullName(req.getFullName())
                .roles(Set.of(Role.USER))
                .enabled(true)
                .build();
        userRepo.save(u);

        return Map.of(
                "message", "Đăng ký thành công",
                "userId", u.getId(),
                "email", u.getEmail()
        );
    }

    @Override
    public Map<String, Object> login(LoginRequest req) {
        User u = userRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Sai email hoặc mật khẩu"));

        // So sánh chuỗi thuần (không mã hóa)
        if (u.getPassword() == null || !Objects.equals(u.getPassword(), req.getPassword())) {
            throw new BadCredentialsException("Sai email hoặc mật khẩu");
        }

        List<String> roleNames = u.getRoles().stream().map(Enum::name).toList();

        // JWT có email + roles
        String token = jwtUtils.generateJWT(u.getEmail(), roleNames);

        Map<String, Object> userBody = new HashMap<>();
        userBody.put("id", u.getId());
        userBody.put("email", u.getEmail());
        userBody.put("roles", roleNames);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("message", "Đăng nhập thành công");
        resp.put("accessToken", token);   // camelCase
        resp.put("access_token", token);  // snake_case
        resp.put("tokenType", "Bearer");
        resp.put("user", userBody);

        return resp;
    }

    @Override
    public User getById(Long id) {
        return userRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy user"));
    }

    @Override
    @Transactional
    public User updateBasic(Long id, User patch) {
        User u = getById(id);
        if (patch.getFullName() != null) u.setFullName(patch.getFullName());
        if (patch.getPhone() != null) u.setPhone(patch.getPhone());
        if (patch.getAddressLine1() != null) u.setAddressLine1(patch.getAddressLine1());
        if (patch.getAddressLine2() != null) u.setAddressLine2(patch.getAddressLine2());
        if (patch.getWard() != null) u.setWard(patch.getWard());
        if (patch.getDistrict() != null) u.setDistrict(patch.getDistrict());
        if (patch.getCity() != null) u.setCity(patch.getCity());
        if (patch.getPostalCode() != null) u.setPostalCode(patch.getPostalCode());
        if (patch.getCountry() != null) u.setCountry(patch.getCountry());
        return u;
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepo.findByEmail(email);
    }


    @Override
    public List<User> search(String q) {
        return userRepo.searchAll(q);
    }

    @Override
    @Transactional
    public User adminCreate(UserAdminCreateRequest req) {
        if (userRepo.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email đã tồn tại");
        }
        User u = User.builder()
                .email(req.getEmail())
                .password(req.getPassword()) // DEV: plain
                .fullName(req.getFullName())
                .phone(req.getPhone())
                .addressLine1(req.getAddressLine1())
                .addressLine2(req.getAddressLine2())
                .ward(req.getWard())
                .district(req.getDistrict())
                .city(req.getCity())
                .postalCode(req.getPostalCode())
                .country(req.getCountry())
                .roles(req.getRoles() == null || req.getRoles().isEmpty() ? Set.of(Role.USER) : req.getRoles())
                .enabled(req.getEnabled() == null ? true : req.getEnabled())
                .build();
        return userRepo.save(u);
    }

//    @Override
//    @Transactional
//    public User adminUpdate(Long id, UserAdminUpdateRequest req) {
//        User u = userRepo.findById(id).orElseThrow(() -> new NoSuchElementException("Không tìm thấy user"));
//        if (req.getFullName() != null) u.setFullName(req.getFullName());
//        if (req.getPhone() != null) u.setPhone(req.getPhone());
//
//        if (req.getAddressLine1() != null) u.setAddressLine1(req.getAddressLine1());
//        if (req.getAddressLine2() != null) u.setAddressLine2(req.getAddressLine2());
//        if (req.getWard() != null) u.setWard(req.getWard());
//        if (req.getDistrict() != null) u.setDistrict(req.getDistrict());
//        if (req.getCity() != null) u.setCity(req.getCity());
//        if (req.getPostalCode() != null) u.setPostalCode(req.getPostalCode());
//        if (req.getCountry() != null) u.setCountry(req.getCountry());
//
//        if (req.getEnabled() != null) u.setEnabled(req.getEnabled());
//        if (req.getRoles() != null) u.setRoles(req.getRoles());
//        if (req.getPassword() != null && !req.getPassword().isBlank()) {
//            u.setPassword(req.getPassword()); // DEV: plain
//        }
//        return u;
//    }


    @Override
    @Transactional
    public void adminDelete(Long id) {
        try {
            userRepo.deleteById(id);
        } catch (DataIntegrityViolationException ex) {
            throw ex;
        }
    }
}
