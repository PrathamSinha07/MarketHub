package com.markethub.modules.cart.service;

import com.markethub.common.exception.ApiException;
import com.markethub.common.exception.ResourceNotFoundException;
import com.markethub.modules.cart.dto.AddToCartRequest;
import com.markethub.modules.cart.dto.CartResponse;
import com.markethub.modules.cart.dto.UpdateCartItemRequest;
import com.markethub.modules.cart.entity.Cart;
import com.markethub.modules.cart.entity.CartItem;
import com.markethub.modules.cart.repository.CartItemRepository;
import com.markethub.modules.cart.repository.CartRepository;
import com.markethub.modules.product.entity.Product;
import com.markethub.modules.product.entity.ProductStatus;
import com.markethub.modules.product.repository.ProductRepository;
import com.markethub.modules.user.entity.Role;
import com.markethub.modules.user.entity.User;
import com.markethub.modules.user.repository.UserRepository;
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
class CartServiceImplTest {

    @Mock
    private CartRepository cartRepository;
    @Mock
    private CartItemRepository cartItemRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CartServiceImpl cartService;

    private User customer;
    private Product product;
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

        product = Product.builder()
                .name("Wireless Mouse")
                .slug("wireless-mouse")
                .price(new BigDecimal("19.99"))
                .stockQuantity(10)
                .status(ProductStatus.ACTIVE)
                .build();
        product.setId(100L);

        cart = Cart.builder().user(customer).build();
        cart.setId(10L);
        cart.setItems(new ArrayList<>());

        lenient().when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> {
            Cart c = invocation.getArgument(0);
            if (c.getId() == null) {
                c.setId(10L);
            }
            return c;
        });
        lenient().when(cartItemRepository.save(any(CartItem.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void addToCart_activeProduct_createsItemWithPriceSnapshot() {
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(100L)).thenReturn(Optional.of(product));

        CartResponse response = cartService.addToCart(1L, new AddToCartRequest(100L, 2));

        assertEquals(1, response.getItems().size());
        assertEquals(new BigDecimal("19.99"), response.getItems().get(0).getUnitPrice());
        assertEquals(new BigDecimal("39.98"), response.getItems().get(0).getSubtotal());
        assertEquals(new BigDecimal("39.98"), response.getSubtotal());
    }

    @Test
    void addToCart_noExistingCart_createsCart() {
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(productRepository.findById(100L)).thenReturn(Optional.of(product));

        CartResponse response = cartService.addToCart(1L, new AddToCartRequest(100L, 1));

        assertEquals(10L, response.getCartId());
        assertEquals(1, response.getItems().size());
    }

    @Test
    void addToCart_sameProductTwice_mergesQuantityAndKeepsOriginalSnapshot() {
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(100L)).thenReturn(Optional.of(product));

        cartService.addToCart(1L, new AddToCartRequest(100L, 2));

        // Price changes before the second add; snapshot must be preserved.
        product.setPrice(new BigDecimal("5.00"));
        CartResponse response = cartService.addToCart(1L, new AddToCartRequest(100L, 3));

        assertEquals(1, response.getItems().size());
        assertEquals(5, response.getItems().get(0).getQuantity());
        assertEquals(new BigDecimal("19.99"), response.getItems().get(0).getUnitPrice());
        assertEquals(new BigDecimal("99.95"), response.getSubtotal());
    }

    @Test
    void addToCart_quantityExceedingStock_rejected() {
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(100L)).thenReturn(Optional.of(product));

        assertThrows(ApiException.class, () -> cartService.addToCart(1L, new AddToCartRequest(100L, 11)));
    }

    @Test
    void addToCart_zeroQuantity_rejected() {
        assertThrows(ApiException.class, () -> cartService.addToCart(1L, new AddToCartRequest(100L, 0)));
        verify(productRepository, never()).findById(anyLong());
    }

    @Test
    void addToCart_unavailableProduct_rejected() {
        for (ProductStatus status : List.of(ProductStatus.ARCHIVED, ProductStatus.DRAFT, ProductStatus.OUT_OF_STOCK)) {
            product.setStatus(status);
            when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
            when(productRepository.findById(100L)).thenReturn(Optional.of(product));

            ApiException ex = assertThrows(ApiException.class,
                    () -> cartService.addToCart(1L, new AddToCartRequest(100L, 1)));
            assertEquals(org.springframework.http.HttpStatus.BAD_REQUEST, ex.getStatus());
        }
    }

    @Test
    void addToCart_missingProduct_returns404Exception() {
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> cartService.addToCart(1L, new AddToCartRequest(999L, 1)));
    }

    @Test
    void getCart_returnsSubtotals() {
        CartItem item = CartItem.builder().cart(cart).product(product).quantity(2).unitPrice(new BigDecimal("19.99")).build();
        cart.getItems().add(item);
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));

        CartResponse response = cartService.getCart(1L);

        assertEquals(10L, response.getCartId());
        assertEquals(1, response.getItems().size());
        assertEquals(new BigDecimal("39.98"), response.getSubtotal());
    }

    @Test
    void getCart_missing_returns404Exception() {
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> cartService.getCart(1L));
    }

    @Test
    void updateCartItem_validQuantity_updatesOnlyQuantity() {
        CartItem item = CartItem.builder().cart(cart).product(product).quantity(1).unitPrice(new BigDecimal("19.99")).build();
        cart.getItems().add(item);
        when(cartItemRepository.findById(50L)).thenReturn(Optional.of(item));

        CartResponse response = cartService.updateCartItem(1L, 50L, new UpdateCartItemRequest(4));

        assertEquals(4, response.getItems().get(0).getQuantity());
        assertEquals(new BigDecimal("19.99"), response.getItems().get(0).getUnitPrice());
    }

    @Test
    void updateCartItem_quantityExceedingStock_rejected() {
        CartItem item = CartItem.builder().cart(cart).product(product).quantity(1).unitPrice(new BigDecimal("19.99")).build();
        cart.getItems().add(item);
        when(cartItemRepository.findById(50L)).thenReturn(Optional.of(item));

        assertThrows(ApiException.class, () -> cartService.updateCartItem(1L, 50L, new UpdateCartItemRequest(100)));
    }

    @Test
    void updateCartItem_zeroQuantity_rejected() {
        assertThrows(ApiException.class, () -> cartService.updateCartItem(1L, 50L, new UpdateCartItemRequest(0)));
    }

    @Test
    void updateCartItem_otherCustomersItem_forbidden() {
        User other = User.builder().email("other@example.com").password("x").firstName("O").lastName("U").role(Role.ROLE_CUSTOMER).build();
        other.setId(2L);
        Cart otherCart = Cart.builder().user(other).build();
        CartItem item = CartItem.builder().cart(otherCart).product(product).quantity(1).unitPrice(new BigDecimal("19.99")).build();
        when(cartItemRepository.findById(50L)).thenReturn(Optional.of(item));

        ApiException ex = assertThrows(ApiException.class, () -> cartService.updateCartItem(1L, 50L, new UpdateCartItemRequest(2)));
        assertEquals(org.springframework.http.HttpStatus.FORBIDDEN, ex.getStatus());
    }

    @Test
    void removeItem_belongingToUser_removesItem() {
        CartItem item = CartItem.builder().cart(cart).product(product).quantity(1).unitPrice(new BigDecimal("19.99")).build();
        cart.getItems().add(item);
        when(cartItemRepository.findById(50L)).thenReturn(Optional.of(item));

        CartResponse response = cartService.removeItem(1L, 50L);

        assertTrue(response.getItems().isEmpty());
        assertEquals(BigDecimal.ZERO, response.getSubtotal());
        verify(cartItemRepository).delete(item);
    }

    @Test
    void removeItem_otherCustomersItem_forbidden() {
        User other = User.builder().email("other@example.com").password("x").firstName("O").lastName("U").role(Role.ROLE_CUSTOMER).build();
        other.setId(2L);
        Cart otherCart = Cart.builder().user(other).build();
        CartItem item = CartItem.builder().cart(otherCart).product(product).quantity(1).unitPrice(new BigDecimal("19.99")).build();
        when(cartItemRepository.findById(50L)).thenReturn(Optional.of(item));

        ApiException ex = assertThrows(ApiException.class, () -> cartService.removeItem(1L, 50L));
        assertEquals(org.springframework.http.HttpStatus.FORBIDDEN, ex.getStatus());
        verify(cartItemRepository, never()).delete(any());
    }

    @Test
    void clearCart_removesAllItems() {
        CartItem item = CartItem.builder().cart(cart).product(product).quantity(1).unitPrice(new BigDecimal("19.99")).build();
        cart.getItems().add(item);
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCartId(10L)).thenReturn(List.of(item));

        CartResponse response = cartService.clearCart(1L);

        assertTrue(response.getItems().isEmpty());
        verify(cartItemRepository).deleteAll(List.of(item));
    }
}
