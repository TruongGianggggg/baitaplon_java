package com.gianglt.baitaplon.service.impl;

import com.gianglt.baitaplon.model.*;
import com.gianglt.baitaplon.repo.*;
import com.gianglt.baitaplon.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepo;
    private final CartItemRepository itemRepo;
    private final ProductRepository productRepo;
    private final UserRepository userRepo;

    @Override
    @Transactional(readOnly = true)
    public Cart getCartByUser(User user) {
        return cartRepo.findWithItemsByUser(user).orElseGet(() -> {
            Cart c = new Cart();
            c.setUser(user);
            return cartRepo.save(c);
        });
    }

    private void applyLinePrice(CartItem item) {
        BigDecimal unit = item.getProduct().getPrice();
        BigDecimal line = unit.multiply(BigDecimal.valueOf(item.getQuantity().longValue()));
        item.setPrice(line);
    }

    @Override
    @Transactional
    public Cart addToCart(User user, Long productId, int quantity) {
        if (quantity <= 0) throw new IllegalArgumentException("Số lượng phải > 0");

        Cart cart = getCartByUser(user);
        Product p = productRepo.findById(productId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy sản phẩm"));

        CartItem item = cart.getItems().stream()
                .filter(i -> i.getProduct().getId().equals(productId))
                .findFirst()
                .orElse(null);

        if (item == null) {
            item = CartItem.builder()
                    .cart(cart)
                    .product(p)
                    .quantity(quantity)
                    .price(BigDecimal.ZERO)
                    .build();
            applyLinePrice(item);
            cart.getItems().add(item);
        } else {
            item.setQuantity(item.getQuantity() + quantity);
            applyLinePrice(item);
        }
        return cartRepo.save(cart);
    }

    @Override
    @Transactional
    public Cart updateQuantity(User user, Long productId, int quantity) {
        Cart cart = getCartByUser(user);
        cart.getItems().removeIf(i -> {
            if (i.getProduct().getId().equals(productId)) {
                if (quantity <= 0) {
                    return true;
                } else {
                    i.setQuantity(quantity);
                    applyLinePrice(i);
                }
            }
            return false;
        });
        return cartRepo.save(cart);
    }

    @Override
    @Transactional
    public Cart removeFromCart(User user, Long productId) {
        Cart cart = getCartByUser(user);
        cart.getItems().removeIf(i -> i.getProduct().getId().equals(productId));
        return cartRepo.save(cart);
    }

    @Override
    @Transactional
    public void clearCart(User user) {
        Cart cart = getCartByUser(user);
        cart.getItems().clear();
        cartRepo.save(cart);
    }
}
