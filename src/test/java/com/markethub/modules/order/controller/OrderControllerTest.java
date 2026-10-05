package com.markethub.modules.order.controller;

import com.markethub.common.exception.ApiException;
import com.markethub.common.exception.ResourceNotFoundException;
import com.markethub.modules.order.dto.OrderItemResponse;
import com.markethub.modules.order.dto.OrderResponse;
import com.markethub.modules.order.dto.SellerOrderItemResponse;
import com.markethub.modules.order.entity.OrderStatus;
import com.markethub.modules.order.service.OrderService;
import com.markethub.modules.user.entity.Role;
import com.markethub.modules.user.entity.User;
import com.markethub.security.CustomUserDetails;
import com.markethub.security.CustomUserDetailsService;
import com.markethub.security.JwtAuthenticationFilter;
import com.markethub.security.JwtService;
import com.markethub.security.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = OrderController.class, excludeAutoConfiguration = org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OrderService orderService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private AuthenticationProvider authenticationProvider;

    private Authentication auth(Long id, Role role) {
        User user = User.builder()
                .email(role.name().toLowerCase() + "@example.com")
                .password("secret")
                .firstName("Test")
                .lastName("User")
                .role(role)
                .build();
        user.setId(id);
        CustomUserDetails principal = new CustomUserDetails(user);
        return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    private OrderResponse sampleOrder() {
        OrderItemResponse item = new OrderItemResponse(11L, 100L, 50L, "Wireless Mouse",
                new BigDecimal("19.99"), 2, new BigDecimal("39.98"));
        return new OrderResponse(900L, 1L, OrderStatus.CONFIRMED, new BigDecimal("39.98"),
                List.of(item), java.time.LocalDateTime.of(2026, 10, 5, 12, 0));
    }

    @Test
    void checkout_asCustomer_returns201() throws Exception {
        when(orderService.checkout(1L)).thenReturn(sampleOrder());

        mockMvc.perform(post("/orders/checkout")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(1L, Role.ROLE_CUSTOMER))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.data.totalAmount").value(39.98));

        verify(orderService).checkout(1L);
    }

    @Test
    void checkout_asSeller_forbidden() throws Exception {
        mockMvc.perform(post("/orders/checkout")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(2L, Role.ROLE_SELLER))))
                .andExpect(status().isForbidden());
    }

    @Test
    void checkout_unauthenticated_rejected() throws Exception {
        mockMvc.perform(post("/orders/checkout"))
                .andExpect(status().isForbidden());
    }

    @Test
    void checkout_emptyCart_400() throws Exception {
        when(orderService.checkout(1L)).thenThrow(new ApiException(HttpStatus.BAD_REQUEST, "Cannot checkout with an empty cart"));

        mockMvc.perform(post("/orders/checkout")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(1L, Role.ROLE_CUSTOMER))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getOrders_asCustomer_returns200() throws Exception {
        when(orderService.getCustomerOrders(1L)).thenReturn(List.of(sampleOrder()));

        mockMvc.perform(get("/orders")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(1L, Role.ROLE_CUSTOMER))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].orderId").value(900));
    }

    @Test
    void getOrders_asSeller_forbidden() throws Exception {
        mockMvc.perform(get("/orders")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(2L, Role.ROLE_SELLER))))
                .andExpect(status().isForbidden());
    }

    @Test
    void getOrders_unauthenticated_rejected() throws Exception {
        mockMvc.perform(get("/orders"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getOrderById_ownOrder_200() throws Exception {
        when(orderService.getOrderById(1L, 900L)).thenReturn(sampleOrder());

        mockMvc.perform(get("/orders/900")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(1L, Role.ROLE_CUSTOMER))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.orderId").value(900));
    }

    @Test
    void getOrderById_otherCustomersOrder_403() throws Exception {
        when(orderService.getOrderById(1L, 900L))
                .thenThrow(new ApiException(HttpStatus.FORBIDDEN, "You do not have permission to access this order"));

        mockMvc.perform(get("/orders/900")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(1L, Role.ROLE_CUSTOMER))))
                .andExpect(status().isForbidden());
    }

    @Test
    void getOrderById_missingOrder_404() throws Exception {
        when(orderService.getOrderById(eq(1L), anyLong()))
                .thenThrow(new ResourceNotFoundException("Order", "id", 999L));

        mockMvc.perform(get("/orders/999")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(1L, Role.ROLE_CUSTOMER))))
                .andExpect(status().isNotFound());
    }

    @Test
    void getSellerOrderItems_asSeller_200() throws Exception {
        SellerOrderItemResponse item = new SellerOrderItemResponse(900L, 11L, 100L, "Wireless Mouse",
                2, new BigDecimal("19.99"), new BigDecimal("39.98"), OrderStatus.CONFIRMED,
                java.time.LocalDateTime.of(2026, 10, 5, 12, 0));
        when(orderService.getSellerOrderItems(2L)).thenReturn(List.of(item));

        mockMvc.perform(get("/orders/seller")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(2L, Role.ROLE_SELLER))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].orderId").value(900))
                .andExpect(jsonPath("$.data[0].productName").value("Wireless Mouse"))
                .andExpect(jsonPath("$.data[0].orderStatus").value("CONFIRMED"));

        verify(orderService).getSellerOrderItems(2L);
    }

    @Test
    void getSellerOrderItems_asCustomer_forbidden() throws Exception {
        mockMvc.perform(get("/orders/seller")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(1L, Role.ROLE_CUSTOMER))))
                .andExpect(status().isForbidden());
    }

    @Test
    void getSellerOrderItems_unauthenticated_rejected() throws Exception {
        mockMvc.perform(get("/orders/seller"))
                .andExpect(status().isForbidden());
    }
}
