package com.markethub.modules.order.service;

import com.markethub.common.exception.ApiException;
import com.markethub.common.exception.ResourceNotFoundException;
import com.markethub.modules.cart.entity.Cart;
import com.markethub.modules.cart.entity.CartItem;
import com.markethub.modules.cart.repository.CartItemRepository;
import com.markethub.modules.cart.repository.CartRepository;
import com.markethub.modules.order.dto.OrderResponse;
import com.markethub.modules.order.dto.SellerOrderItemResponse;
import com.markethub.modules.order.entity.Order;
import com.markethub.modules.order.entity.OrderItem;
import com.markethub.modules.order.entity.OrderStatus;
import com.markethub.modules.order.repository.OrderItemRepository;
import com.markethub.modules.order.repository.OrderRepository;
import com.markethub.modules.product.entity.Product;
import com.markethub.modules.product.entity.ProductStatus;
import com.markethub.modules.product.repository.ProductRepository;
import com.markethub.modules.user.entity.Role;
import com.markethub.modules.user.entity.SellerProfile;
import com.markethub.modules.user.entity.User;
import com.markethub.modules.user.repository.SellerProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private CartRepository cartRepository;
    @Mock
    private CartItemRepository cartItemRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private SellerProfileRepository sellerProfileRepository;

    @InjectMocks
    private OrderServiceImpl orderService;

    private User customer;
    private SellerProfile sellerA;
    private SellerProfile sellerB;
    private Cart cart;

    @BeforeEach
    void setUp() {
        customer = User.builder()
                .email("customer@example.com")
                .password("secret")
                .firstName("Test")
                .lastName("Customer")
                .role(Role.ROLE_CUSTOMER)
                .build();
        customer.setId(1L);

        User sellerUserA = User.builder().email("a@example.com").password("x")
                .firstName("A").lastName("Seller").role(Role.ROLE_SELLER).build();
        sellerUserA.setId(10L);
        sellerA = SellerProfile.builder().storeName("StoreA").user(sellerUserA).build();
        sellerA.setId(100L);

        User sellerUserB = User.builder().email("b@example.com").password("x")
                .firstName("B").lastName("Seller").role(Role.ROLE_SELLER).build();
        sellerUserB.setId(11L);
        sellerB = SellerProfile.builder().storeName("StoreB").user(sellerUserB).build();
        sellerB.setId(101L);

        cart = Cart.builder().user(customer).items(new ArrayList<>()).build();
        cart.setId(5L);

        lenient().when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            if (o.getId() == null) {
                o.setId(900L);
            }
            return o;
        });
    }

    private Product product(Long id, String name, BigDecimal price, int stock, SellerProfile seller) {
        Product p = Product.builder()
                .name(name)
                .slug(name.toLowerCase().replace(' ', '-'))
                .price(price)
                .stockQuantity(stock)
                .status(ProductStatus.ACTIVE)
                .seller(seller)
                .build();
        p.setId(id);
        return p;
    }

    private void addCartItem(Product p, int qty) {
        cart.getItems().add(CartItem.builder()
                .cart(cart).product(p).quantity(qty)
                .unitPrice(new BigDecimal("0.01")) // stale cart snapshot, must not be trusted
                .build());
    }

    @Test
    void checkout_validCart_createsConfirmedOrder() {
        Product p = product(100L, "Wireless Mouse", new BigDecimal("19.99"), 10, sellerA);
        addCartItem(p, 2);
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(100L)).thenReturn(Optional.of(p));

        OrderResponse response = orderService.checkout(1L);

        assertEquals(OrderStatus.CONFIRMED, response.getStatus());
        assertEquals(1, response.getItems().size());
        verify(orderRepository).save(any(Order.class));
    }

    @Test
    void checkout_emptyCart_rejected() {
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));

        ApiException ex = assertThrows(ApiException.class, () -> orderService.checkout(1L));
        assertEquals(400, ex.getStatus().value());
    }

    @Test
    void checkout_missingCart_notFound() {
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> orderService.checkout(1L));
    }

    @Test
    void checkout_productUnavailable_rejected() {
        Product p = product(100L, "Mouse", new BigDecimal("19.99"), 10, sellerA);
        p.setStatus(ProductStatus.ARCHIVED);
        addCartItem(p, 1);
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(100L)).thenReturn(Optional.of(p));

        ApiException ex = assertThrows(ApiException.class, () -> orderService.checkout(1L));
        assertEquals(400, ex.getStatus().value());
    }

    @Test
    void checkout_insufficientStock_rejected() {
        Product p = product(100L, "Mouse", new BigDecimal("19.99"), 1, sellerA);
        addCartItem(p, 5);
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(100L)).thenReturn(Optional.of(p));

        ApiException ex = assertThrows(ApiException.class, () -> orderService.checkout(1L));
        assertEquals(400, ex.getStatus().value());
        assertEquals(1, p.getStockQuantity());
    }

    @Test
    void checkout_usesCurrentProductPriceNotCartSnapshot() {
        Product p = product(100L, "Mouse", new BigDecimal("25.00"), 10, sellerA);
        addCartItem(p, 2);
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(100L)).thenReturn(Optional.of(p));

        OrderResponse response = orderService.checkout(1L);

        assertEquals(new BigDecimal("25.00"), response.getItems().get(0).getUnitPrice());
        assertEquals(new BigDecimal("50.00"), response.getItems().get(0).getSubtotal());
    }

    @Test
    void checkout_snapshotsProductName() {
        Product p = product(100L, "Wireless Mouse", new BigDecimal("19.99"), 10, sellerA);
        addCartItem(p, 1);
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(100L)).thenReturn(Optional.of(p));

        OrderResponse response = orderService.checkout(1L);

        assertEquals("Wireless Mouse", response.getItems().get(0).getProductName());
    }

    @Test
    void checkout_subtotalAndTotalCorrect() {
        Product p1 = product(100L, "Mouse", new BigDecimal("19.99"), 10, sellerA);
        Product p2 = product(101L, "Keyboard", new BigDecimal("49.50"), 10, sellerB);
        addCartItem(p1, 2);
        addCartItem(p2, 1);
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(100L)).thenReturn(Optional.of(p1));
        when(productRepository.findById(101L)).thenReturn(Optional.of(p2));

        OrderResponse response = orderService.checkout(1L);

        assertEquals(new BigDecimal("39.98"), response.getItems().get(0).getSubtotal());
        assertEquals(new BigDecimal("49.50"), response.getItems().get(1).getSubtotal());
        assertEquals(new BigDecimal("89.48"), response.getTotalAmount());
    }

    @Test
    void checkout_decrementsStock() {
        Product p = product(100L, "Mouse", new BigDecimal("19.99"), 10, sellerA);
        addCartItem(p, 3);
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(100L)).thenReturn(Optional.of(p));

        orderService.checkout(1L);

        assertEquals(7, p.getStockQuantity());
        verify(productRepository).save(p);
    }

    @Test
    void checkout_clearsCartOnlyOnSuccess() {
        Product p = product(100L, "Mouse", new BigDecimal("19.99"), 10, sellerA);
        addCartItem(p, 1);
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(100L)).thenReturn(Optional.of(p));

        orderService.checkout(1L);

        assertTrue(cart.getItems().isEmpty());
        verify(cartItemRepository).deleteAll(any());
    }

    @Test
    void checkout_multiSeller_oneOrderBothItems() {
        Product p1 = product(100L, "Mouse", new BigDecimal("10.00"), 10, sellerA);
        Product p2 = product(101L, "Keyboard", new BigDecimal("20.00"), 10, sellerB);
        addCartItem(p1, 1);
        addCartItem(p2, 2);
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(100L)).thenReturn(Optional.of(p1));
        when(productRepository.findById(101L)).thenReturn(Optional.of(p2));

        ArgumentCaptor<Order> captor = ArgumentCaptor.forClass(Order.class);
        orderService.checkout(1L);
        verify(orderRepository).save(captor.capture());

        Order order = captor.getValue();
        assertEquals(2, order.getItems().size());
        assertEquals(new BigDecimal("50.00"), order.getTotalAmount());
    }

    @Test
    void checkout_itemsRetainSellerProfile() {
        Product p1 = product(100L, "Mouse", new BigDecimal("10.00"), 10, sellerA);
        Product p2 = product(101L, "Keyboard", new BigDecimal("20.00"), 10, sellerB);
        addCartItem(p1, 1);
        addCartItem(p2, 1);
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(100L)).thenReturn(Optional.of(p1));
        when(productRepository.findById(101L)).thenReturn(Optional.of(p2));

        ArgumentCaptor<Order> captor = ArgumentCaptor.forClass(Order.class);
        orderService.checkout(1L);
        verify(orderRepository).save(captor.capture());

        assertEquals(sellerA.getId(), captor.getValue().getItems().get(0).getSeller().getId());
        assertEquals(sellerB.getId(), captor.getValue().getItems().get(1).getSeller().getId());
    }

    @Test
    void checkout_failure_noOrderSavedNoStockDecrementNoCartClear() {
        Product bad = product(100L, "Mouse", new BigDecimal("10.00"), 0, sellerA);
        addCartItem(bad, 1);
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(100L)).thenReturn(Optional.of(bad));

        assertThrows(ApiException.class, () -> orderService.checkout(1L));

        assertEquals(0, bad.getStockQuantity());
        verify(orderRepository, never()).save(any());
        verify(productRepository, never()).save(any());
        verify(cartItemRepository, never()).deleteAll(any());
        assertEquals(1, cart.getItems().size());
    }

    @Test
    void checkout_failedCheckout_cartUnchanged() {
        Product p = product(100L, "Mouse", new BigDecimal("10.00"), 1, sellerA);
        addCartItem(p, 3);
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(100L)).thenReturn(Optional.of(p));

        assertThrows(ApiException.class, () -> orderService.checkout(1L));

        assertEquals(1, cart.getItems().size());
        verify(cartItemRepository, never()).deleteAll(any());
    }

    @Test
    void checkout_stockNeverNegative() {
        Product p = product(100L, "Mouse", new BigDecimal("10.00"), 2, sellerA);
        addCartItem(p, 5);
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(100L)).thenReturn(Optional.of(p));

        ApiException ex = assertThrows(ApiException.class, () -> orderService.checkout(1L));

        assertEquals(400, ex.getStatus().value());
        assertTrue(p.getStockQuantity() >= 0);
    }

    @Test
    void getCustomerOrders_returnsOnlyOwn() {
        Order order = orderFor(customer, OrderStatus.CONFIRMED);
        when(orderRepository.findByUserId(1L)).thenReturn(List.of(order));

        List<OrderResponse> result = orderService.getCustomerOrders(1L);

        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getUserId());
        verify(orderRepository).findByUserId(1L);
    }

    @Test
    void getOrderById_ownOrder_ok() {
        Order order = orderFor(customer, OrderStatus.CONFIRMED);
        when(orderRepository.findById(900L)).thenReturn(Optional.of(order));

        OrderResponse response = orderService.getOrderById(1L, 900L);

        assertEquals(900L, response.getOrderId());
    }

    @Test
    void getOrderById_otherCustomersOrder_forbidden() {
        User other = User.builder().email("o@example.com").password("x")
                .firstName("O").lastName("U").role(Role.ROLE_CUSTOMER).build();
        other.setId(2L);
        Order order = orderFor(other, OrderStatus.CONFIRMED);
        when(orderRepository.findById(900L)).thenReturn(Optional.of(order));

        ApiException ex = assertThrows(ApiException.class, () -> orderService.getOrderById(1L, 900L));
        assertEquals(403, ex.getStatus().value());
    }

    @Test
    void getSellerOrderItems_onlyOwnItems() {
        OrderItem a1 = orderItemWith(10L, sellerA);
        when(sellerProfileRepository.findByUserId(10L)).thenReturn(Optional.of(sellerA));
        when(orderItemRepository.findBySellerId(100L)).thenReturn(List.of(a1));

        List<SellerOrderItemResponse> result = orderService.getSellerOrderItems(10L);

        assertEquals(1, result.size());
        assertEquals(a1.getId(), result.get(0).getOrderItemId());
        verify(orderItemRepository).findBySellerId(100L);
        verify(orderItemRepository, never()).findBySellerId(101L);
    }

    @Test
    void getSellerOrderItems_sellerBGetsOnlyTheirItems() {
        OrderItem b1 = orderItemWith(20L, sellerB);
        when(sellerProfileRepository.findByUserId(11L)).thenReturn(Optional.of(sellerB));
        when(orderItemRepository.findBySellerId(101L)).thenReturn(List.of(b1));

        List<SellerOrderItemResponse> result = orderService.getSellerOrderItems(11L);

        assertEquals(1, result.size());
        assertEquals(b1.getId(), result.get(0).getOrderItemId());
        verify(orderItemRepository).findBySellerId(101L);
    }

    @Test
    void getSellerOrderItems_sellerWithoutProfile_notFound() {
        when(sellerProfileRepository.findByUserId(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> orderService.getSellerOrderItems(99L));
    }

    private Order orderFor(User user, OrderStatus status) {
        Order order = Order.builder()
                .user(user)
                .status(status)
                .totalAmount(new BigDecimal("42.00"))
                .items(new ArrayList<>())
                .build();
        order.setId(900L);
        return order;
    }

    private OrderItem orderItemWith(Long id, SellerProfile seller) {
        User other = User.builder().email("c@example.com").password("x")
                .firstName("C").lastName("U").role(Role.ROLE_CUSTOMER).build();
        other.setId(1L);
        Order order = orderFor(other, OrderStatus.CONFIRMED);
        order.setId(500L);
        order.setCreatedAt(java.time.LocalDateTime.of(2026, 10, 5, 12, 0));
        Product p = product(100L, "Mouse", new BigDecimal("19.99"), 5, seller);
        OrderItem item = OrderItem.builder()
                .order(order).product(p).seller(seller)
                .productName("Mouse").unitPrice(new BigDecimal("19.99"))
                .quantity(1).subtotal(new BigDecimal("19.99"))
                .build();
        item.setId(id);
        return item;
    }
}
