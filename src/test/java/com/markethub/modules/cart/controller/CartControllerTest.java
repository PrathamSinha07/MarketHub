package com.markethub.modules.cart.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.markethub.common.exception.ApiException;
import com.markethub.common.exception.ResourceNotFoundException;
import com.markethub.modules.cart.dto.AddToCartRequest;
import com.markethub.modules.cart.dto.CartItemResponse;
import com.markethub.modules.cart.dto.CartResponse;
import com.markethub.modules.cart.dto.UpdateCartItemRequest;
import com.markethub.modules.cart.service.CartService;
import com.markethub.security.CustomUserDetails;
import com.markethub.security.JwtAuthenticationFilter;
import com.markethub.security.JwtService;
import com.markethub.security.SecurityConfig;
import com.markethub.modules.user.entity.Role;
import com.markethub.modules.user.entity.User;
import com.markethub.security.CustomUserDetailsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = CartController.class, excludeAutoConfiguration = org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class CartControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CartService cartService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private AuthenticationProvider authenticationProvider;

    private Authentication customerAuth(Long id) {
        User user = User.builder()
                .email("customer@example.com")
                .password("secret")
                .firstName("Test")
                .lastName("Customer")
                .role(Role.ROLE_CUSTOMER)
                .build();
        user.setId(id);
        CustomUserDetails principal = new CustomUserDetails(user);
        return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    private Authentication sellerAuth(Long id) {
        User user = User.builder()
                .email("seller@example.com")
                .password("secret")
                .firstName("Test")
                .lastName("Seller")
                .role(Role.ROLE_SELLER)
                .build();
        user.setId(id);
        CustomUserDetails principal = new CustomUserDetails(user);
        return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    private CartResponse sampleResponse() {
        CartItemResponse item = new CartItemResponse(50L, 100L, "Wireless Mouse", 2,
                new BigDecimal("19.99"), new BigDecimal("39.98"));
        return new CartResponse(10L, List.of(item), new BigDecimal("39.98"));
    }

    @Test
    void getCart_asCustomer_returns200WithDto() throws Exception {
        when(cartService.getCart(1L)).thenReturn(sampleResponse());

        mockMvc.perform(get("/cart").with(SecurityMockMvcRequestPostProcessors.authentication(customerAuth(1L))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.cartId").value(10))
                .andExpect(jsonPath("$.data.items[0].productName").value("Wireless Mouse"))
                .andExpect(jsonPath("$.data.subtotal").value(39.98));

        verify(cartService).getCart(1L);
    }

    @Test
    void getCart_unauthenticated_rejected() throws Exception {
        mockMvc.perform(get("/cart"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getCart_sellerRole_rejected() throws Exception {
        mockMvc.perform(get("/cart").with(SecurityMockMvcRequestPostProcessors.authentication(sellerAuth(5L))))
                .andExpect(status().isForbidden());
    }

    @Test
    void addItem_asCustomer_returns200() throws Exception {
        when(cartService.addToCart(eq(1L), any(AddToCartRequest.class))).thenReturn(sampleResponse());

        mockMvc.perform(post("/cart/items")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(customerAuth(1L)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AddToCartRequest(100L, 2))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].quantity").value(2));
    }

    @Test
    void addItem_missingProduct_returns404() throws Exception {
        when(cartService.addToCart(eq(1L), any(AddToCartRequest.class)))
                .thenThrow(new ResourceNotFoundException("Product", "id", 999L));

        mockMvc.perform(post("/cart/items")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(customerAuth(1L)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AddToCartRequest(999L, 1))))
                .andExpect(status().isNotFound());
    }

    @Test
    void addItem_unavailableProduct_returns400() throws Exception {
        when(cartService.addToCart(eq(1L), any(AddToCartRequest.class)))
                .thenThrow(new ApiException(HttpStatus.BAD_REQUEST, "Product is not available for purchase"));

        mockMvc.perform(post("/cart/items")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(customerAuth(1L)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AddToCartRequest(100L, 1))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void addItem_invalidQuantity_returns400() throws Exception {
        mockMvc.perform(post("/cart/items")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(customerAuth(1L)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AddToCartRequest(100L, 0))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateItem_asCustomer_returns200() throws Exception {
        when(cartService.updateCartItem(eq(1L), eq(50L), any(UpdateCartItemRequest.class))).thenReturn(sampleResponse());

        mockMvc.perform(put("/cart/items/50")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(customerAuth(1L)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateCartItemRequest(3))))
                .andExpect(status().isOk());

        verify(cartService).updateCartItem(eq(1L), eq(50L), any(UpdateCartItemRequest.class));
    }

    @Test
    void updateItem_otherCustomersItem_returns403() throws Exception {
        when(cartService.updateCartItem(eq(1L), eq(50L), any(UpdateCartItemRequest.class)))
                .thenThrow(new ApiException(HttpStatus.FORBIDDEN, "You do not have permission to modify this cart item"));

        mockMvc.perform(put("/cart/items/50")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(customerAuth(1L)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateCartItemRequest(3))))
                .andExpect(status().isForbidden());
    }

    @Test
    void removeItem_asCustomer_returns200() throws Exception {
        when(cartService.removeItem(1L, 50L)).thenReturn(new CartResponse(10L, List.of(), BigDecimal.ZERO));

        mockMvc.perform(delete("/cart/items/50")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(customerAuth(1L))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.subtotal").value(0));
    }

    @Test
    void removeItem_missingItem_returns404() throws Exception {
        when(cartService.removeItem(anyLong(), anyLong()))
                .thenThrow(new ResourceNotFoundException("CartItem", "id", 50L));

        mockMvc.perform(delete("/cart/items/50")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(customerAuth(1L))))
                .andExpect(status().isNotFound());
    }

    @Test
    void clearCart_asCustomer_returns200() throws Exception {
        when(cartService.clearCart(1L)).thenReturn(new CartResponse(10L, List.of(), BigDecimal.ZERO));

        mockMvc.perform(delete("/cart")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(customerAuth(1L))))
                .andExpect(status().isOk());

        verify(cartService).clearCart(1L);
    }

    @Test
    void clearCart_sellerRole_rejected() throws Exception {
        mockMvc.perform(delete("/cart").with(SecurityMockMvcRequestPostProcessors.authentication(sellerAuth(5L))))
                .andExpect(status().isForbidden());
    }
}
