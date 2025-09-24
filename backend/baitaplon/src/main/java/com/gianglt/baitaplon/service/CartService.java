package com.gianglt.baitaplon.service;

import com.gianglt.baitaplon.model.Cart;
import com.gianglt.baitaplon.model.User;

public interface CartService {
    Cart getCartByUser(User user);
    Cart addToCart(User user, Long productId, int quantity);
    Cart updateQuantity(User user, Long productId, int quantity);
    Cart removeFromCart(User user, Long productId);
    void clearCart(User user);
}
