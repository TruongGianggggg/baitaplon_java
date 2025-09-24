package com.gianglt.baitaplon.controller;

import com.gianglt.baitaplon.model.Cart;
import com.gianglt.baitaplon.model.User;
import com.gianglt.baitaplon.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<Cart> getCart(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(cartService.getCartByUser(user));
    }

    @PostMapping("/add")
    public ResponseEntity<Cart> add(@AuthenticationPrincipal User user,
                                    @RequestParam Long productId,
                                    @RequestParam int quantity) {
        return ResponseEntity.ok(cartService.addToCart(user, productId, quantity));
    }

    @PutMapping("/update")
    public ResponseEntity<Cart> update(@AuthenticationPrincipal User user,
                                       @RequestParam Long productId,
                                       @RequestParam int quantity) {
        return ResponseEntity.ok(cartService.updateQuantity(user, productId, quantity));
    }

    @DeleteMapping("/remove")
    public ResponseEntity<Cart> remove(@AuthenticationPrincipal User user,
                                       @RequestParam Long productId) {
        return ResponseEntity.ok(cartService.removeFromCart(user, productId));
    }

    @DeleteMapping("/clear")
    public ResponseEntity<Void> clear(@AuthenticationPrincipal User user) {
        cartService.clearCart(user);
        return ResponseEntity.noContent().build();
    }
}
