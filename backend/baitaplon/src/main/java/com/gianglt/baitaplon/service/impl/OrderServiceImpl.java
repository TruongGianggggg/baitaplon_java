package com.gianglt.baitaplon.service.impl;

import com.gianglt.baitaplon.domain.*;
import com.gianglt.baitaplon.dto.CartItemDto;
import com.gianglt.baitaplon.dto.CheckoutRequest;
import com.gianglt.baitaplon.dto.OrderDto;
import com.gianglt.baitaplon.dto.OrderItemDto;
import com.gianglt.baitaplon.model.*;
import com.gianglt.baitaplon.repo.*;
import com.gianglt.baitaplon.service.CouponService;
import com.gianglt.baitaplon.service.OrderService;
import com.gianglt.baitaplon.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final UserRepository userRepo;
    private final CartRepository cartRepo;
    private final OrderRepository orderRepo;
    private final ProductRepository productRepo;
    private final CouponService couponService;
    private final PaymentService paymentService;

    // ==================== ĐỌC DỮ LIỆU ====================

    @Override
    @Transactional(readOnly = true)
    public OrderDto get(Long id) {
        Order o = orderRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Order không tồn tại"));
        initOrderGraph(o, true);
        return mapToDto(o, true);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderDto> getAll() {
        List<Order> orders = orderRepo.findAll();
        List<OrderDto> result = new ArrayList<>(orders.size());
        for (Order o : orders) {
            initOrderGraph(o, false);
            result.add(mapToDto(o, false));
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderDto> getByUserId(Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User không tồn tại"));
        List<Order> orders = orderRepo.findByUserOrderByCreatedAtDesc(user);
        List<OrderDto> result = new ArrayList<>(orders.size());
        for (Order o : orders) {
            initOrderGraph(o, false);
            result.add(mapToDto(o, false));
        }
        return result;
    }

    // ==================== CHECKOUT ====================

    @Override
    @Transactional
    public Map<String, Object> checkout(CheckoutRequest req) {
        User user = userRepo.findById(req.getUserId())
                .orElseThrow(() -> new NoSuchElementException("User không tồn tại"));

        // Ưu tiên lấy items từ FE
        final boolean useReqItems = (req.getItems() != null && !req.getItems().isEmpty());
        Cart sourceCart;

        if (useReqItems) {
            sourceCart = buildVirtualCartFromItems(user, req.getItems()); // giỏ ảo từ FE
        } else {
            sourceCart = cartRepo.findByUser(user)
                    .orElseThrow(() -> new NoSuchElementException("Giỏ hàng trống"));
        }

        if (sourceCart.getItems() == null || sourceCart.getItems().isEmpty()) {
            throw new IllegalArgumentException("Giỏ hàng trống");
        }

        // Tính subtotal từ giá hiện hành
        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem ci : sourceCart.getItems()) {
            Product p = productRepo.findById(ci.getProduct().getId())
                    .orElseThrow(() -> new NoSuchElementException("Không tìm thấy sản phẩm id=" + ci.getProduct().getId()));
            BigDecimal priceNow = p.getPrice() != null ? p.getPrice() : BigDecimal.ZERO;
            int qty = ci.getQuantity() == null ? 0 : ci.getQuantity();
            subtotal = subtotal.add(priceNow.multiply(BigDecimal.valueOf(qty)));
        }

        BigDecimal shippingFee = BigDecimal.ZERO;
        BigDecimal discount = BigDecimal.ZERO;

        if (req.getCouponCode() != null && !req.getCouponCode().isBlank()) {
            Map<String,Object> prev = couponService.preview(req.getCouponCode(), user, sourceCart);
            discount = (BigDecimal) prev.getOrDefault("discount", BigDecimal.ZERO);
        }

        BigDecimal total = subtotal.subtract(discount).add(shippingFee);
        if (total.compareTo(BigDecimal.ZERO) < 0) total = BigDecimal.ZERO;

        PaymentMethod pm = (req.getPaymentMethod() == null) ? PaymentMethod.COD : req.getPaymentMethod();

        // Snapshot địa chỉ
        Order order = Order.builder()
                .user(user)
                .subtotal(subtotal)
                .discountAmount(discount)
                .shippingFee(shippingFee)
                .totalAmount(total)
                .couponCode(req.getCouponCode())
                .paymentMethod(pm)
                .status(pm == PaymentMethod.COD ? OrderStatus.NEW : OrderStatus.PENDING_PAYMENT)
                .receiverName(req.getReceiverName() != null ? req.getReceiverName() : user.getFullName())
                .receiverPhone(req.getReceiverPhone() != null ? req.getReceiverPhone() : user.getPhone())
                .shipAddressLine1(req.getShipAddressLine1() != null ? req.getShipAddressLine1() : user.getAddressLine1())
                .shipAddressLine2(req.getShipAddressLine2() != null ? req.getShipAddressLine2() : user.getAddressLine2())
                .shipWard(req.getShipWard() != null ? req.getShipWard() : user.getWard())
                .shipDistrict(req.getShipDistrict() != null ? req.getShipDistrict() : user.getDistrict())
                .shipCity(req.getShipCity() != null ? req.getShipCity() : user.getCity())
                .shipPostalCode(req.getShipPostalCode() != null ? req.getShipPostalCode() : user.getPostalCode())
                .shipCountry(req.getShipCountry() != null ? req.getShipCountry() : user.getCountry())
                .build();

        // Copy items vào Order
        for (CartItem ci : sourceCart.getItems()) {
            Product p = productRepo.findById(ci.getProduct().getId()).orElseThrow();
            int qty = ci.getQuantity() == null ? 0 : ci.getQuantity();
            if (p.getStock() < qty) {
                throw new IllegalArgumentException("Sản phẩm " + p.getName() + " không đủ hàng");
            }
            BigDecimal priceNow = p.getPrice() != null ? p.getPrice() : BigDecimal.ZERO;

            p.setStock(p.getStock() - qty);

            order.getItems().add(OrderItem.builder()
                    .order(order)
                    .product(p)
                    .productNameSnapshot(p.getName())
                    .skuSnapshot(p.getSku())
                    .price(priceNow)
                    .quantity(qty)
                    .build());
        }

        // Payment
        Payment payment = Payment.builder()
                .order(order)
                .method(pm)
                .status(pm == PaymentMethod.COD ? PaymentStatus.PAID : PaymentStatus.PENDING)
                .provider(pm == PaymentMethod.VNPAY ? "VNPAY" : "COD")
                .amount(total)
                .build();
        order.setPayment(payment);

        orderRepo.save(order);

        // ✅ luôn clear giỏ trong DB của user sau khi tạo đơn
        clearUserDbCart(user);

        if (pm == PaymentMethod.COD) {
            if (req.getCouponCode() != null && !req.getCouponCode().isBlank()) {
                couponService.redeem(req.getCouponCode(), user, sourceCart, order.getId());
            }
            return Map.of("orderId", order.getId(), "status", order.getStatus(), "total", order.getTotalAmount());
        } else {
            String payUrl = paymentService.buildVnpayUrl(order, "127.0.0.1");
            return Map.of("orderId", order.getId(), "paymentUrl", payUrl);
        }
    }

    // ==================== Helpers ====================

    private void initOrderGraph(Order o, boolean withItems) {
        if (o.getUser() != null) {
            o.getUser().getId();
            if (o.getUser().getEmail() != null) o.getUser().getEmail();
            if (o.getUser().getFullName() != null) o.getUser().getFullName();
        }
        if (o.getItems() != null) {
            if (withItems) {
                o.getItems().forEach(it -> { if (it.getProduct() != null) it.getProduct().getId(); });
            }
            o.getItems().size();
        }
        if (o.getPayment() != null) {
            o.getPayment().getMethod();
        }
    }

    private OrderDto mapToDto(Order o, boolean withItems) {
        List<OrderItemDto> itemDtos = null;
        if (withItems && o.getItems() != null) {
            itemDtos = new ArrayList<>(o.getItems().size());
            for (OrderItem it : o.getItems()) {
                BigDecimal price = it.getPrice() != null ? it.getPrice() : BigDecimal.ZERO;
                int qty = it.getQuantity() != null ? it.getQuantity() : 0;
                itemDtos.add(OrderItemDto.builder()
                        .productId(it.getProduct() != null ? it.getProduct().getId() : null)
                        .productName(it.getProductNameSnapshot())
                        .sku(it.getSkuSnapshot())
                        .price(price)
                        .quantity(qty)
                        .lineTotal(price.multiply(BigDecimal.valueOf(qty)))
                        .build());
            }
        }

        int itemsTotalQty = 0;
        if (o.getItems() != null) {
            itemsTotalQty = o.getItems().stream()
                    .mapToInt(it -> it.getQuantity() == null ? 0 : it.getQuantity())
                    .sum();
        }

        return OrderDto.builder()
                .id(o.getId())
                .userId(o.getUser() != null ? o.getUser().getId() : null)
                .userEmail(o.getUser() != null ? o.getUser().getEmail() : null)
                .userFullName(o.getUser() != null ? o.getUser().getFullName() : null)
                .subtotal(o.getSubtotal())
                .discountAmount(o.getDiscountAmount())
                .shippingFee(o.getShippingFee())
                .totalAmount(o.getTotalAmount())
                .couponCode(o.getCouponCode())
                .status(o.getStatus())
                .paymentMethod(o.getPaymentMethod())
                .receiverName(o.getReceiverName())
                .receiverPhone(o.getReceiverPhone())
                .shipAddressLine1(o.getShipAddressLine1())
                .shipAddressLine2(o.getShipAddressLine2())
                .shipWard(o.getShipWard())
                .shipDistrict(o.getShipDistrict())
                .shipCity(o.getShipCity())
                .shipPostalCode(o.getShipPostalCode())
                .shipCountry(o.getShipCountry())
                .createdAt(o.getCreatedAt())
                .items(withItems ? itemDtos : null)
                .itemsTotalQuantity(itemsTotalQty)
                .build();
    }

    /**
     * Tạo cart ảo từ items FE gửi lên (chỉ để tính toán, không lưu DB).
     */
    private Cart buildVirtualCartFromItems(User user, List<CartItemDto> items) {
        Cart cart = Cart.builder()
                .user(user)
                .items(new ArrayList<>())
                .build();

        for (CartItemDto dto : items) {
            if (dto.getProductId() == null) continue;
            Product p = productRepo.findById(dto.getProductId())
                    .orElseThrow(() -> new NoSuchElementException("Không tìm thấy sản phẩm id=" + dto.getProductId()));
            int qty = (dto.getQuantity() == null || dto.getQuantity() < 1) ? 1 : dto.getQuantity();
            BigDecimal priceNow = p.getPrice() != null ? p.getPrice() : BigDecimal.ZERO;

            cart.getItems().add(CartItem.builder()
                    .cart(cart)
                    .product(p)
                    .price(priceNow)
                    .quantity(qty)
                    .build());
        }
        return cart;
    }

    /**
     * Luôn clear giỏ DB sau khi checkout.
     */
    private void clearUserDbCart(User user) {
        cartRepo.findByUser(user).ifPresent(dbCart -> {
            if (dbCart.getItems() != null && !dbCart.getItems().isEmpty()) {
                dbCart.getItems().clear();
                cartRepo.save(dbCart);
            }
        });
    }
}
