// src/main/java/com/gianglt/baitaplon/controller/UserController.java
package com.gianglt.baitaplon.controller;

import com.gianglt.baitaplon.dto.LoginRequest;
import com.gianglt.baitaplon.dto.RegisterRequest;
import com.gianglt.baitaplon.dto.UserAdminCreateRequest;
import com.gianglt.baitaplon.dto.UserAdminUpdateRequest;
import com.gianglt.baitaplon.model.User;
import com.gianglt.baitaplon.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(userService.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(userService.login(req));
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> update(@PathVariable Long id, @RequestBody User patch) {
        return ResponseEntity.ok(userService.updateBasic(id, patch));
    }

    @GetMapping
    public ResponseEntity<List<User>> list(@RequestParam(required = false) String q) {
        return ResponseEntity.ok(userService.search(q));
    }

    @PostMapping
    public ResponseEntity<User> adminCreate(@Valid @RequestBody UserAdminCreateRequest req) {
        return ResponseEntity.ok(userService.adminCreate(req));
    }

//    @PatchMapping("/{id}")
//    public ResponseEntity<User> adminPatch(@PathVariable Long id, @RequestBody UserAdminUpdateRequest req) {
//        return ResponseEntity.ok(userService.adminUpdate(id, req));
//    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> adminDelete(@PathVariable Long id) {
        userService.adminDelete(id);
        return ResponseEntity.noContent().build();
    }
}
