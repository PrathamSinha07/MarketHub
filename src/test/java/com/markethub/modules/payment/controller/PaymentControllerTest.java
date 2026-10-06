package com.markethub.modules.payment.controller;

import com.markethub.common.exception.ApiException;
import com.markethub.modules.payment.dto.PaymentResponse;
import com.markethub.modules.payment.entity.PaymentMethod;
import com.markethub.modules.payment.entity.PaymentStatus;
import com.markethub.modules.payment.service.PaymentService;
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
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PaymentController.class, excludeAutoConfiguration = org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PaymentService paymentService;

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

    private PaymentResponse samplePayment() {
        return new PaymentResponse(100L, 900L, 1L, PaymentMethod.UPI, PaymentStatus.PENDING,
                new BigDecimal("39.98"), "INR", "PAY-1", null, java.time.LocalDateTime.of(2026, 10, 6, 10, 0));
    }

    @Test
    void initiatePayment_asCustomer_returns201() throws Exception {
        when(paymentService.initiatePayment(eq(1L), eq(900L), eq(PaymentMethod.UPI), eq("key-1")))
                .thenReturn(samplePayment());

        mockMvc.perform(post("/payments")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(1L, Role.ROLE_CUSTOMER)))
                        .header("Idempotency-Key", "key-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderId\":900,\"paymentMethod\":\"UPI\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.currency").value("INR"));

        verify(paymentService).initiatePayment(1L, 900L, PaymentMethod.UPI, "key-1");
    }

    @Test
    void initiatePayment_asSeller_forbidden() throws Exception {
        mockMvc.perform(post("/payments")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(2L, Role.ROLE_SELLER)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderId\":900,\"paymentMethod\":\"UPI\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void initiatePayment_unauthenticated_rejected() throws Exception {
        mockMvc.perform(post("/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderId\":900,\"paymentMethod\":\"UPI\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void initiatePayment_clientAmountCannotBeOverridden() throws Exception {
        when(paymentService.initiatePayment(eq(1L), eq(900L), eq(PaymentMethod.CARD), isNull()))
                .thenReturn(samplePayment());

        mockMvc.perform(post("/payments")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(1L, Role.ROLE_CUSTOMER)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderId\":900,\"paymentMethod\":\"CARD\",\"amount\":1,\"currency\":\"USD\",\"status\":\"CAPTURED\",\"userId\":2}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.amount").value(39.98));

        verify(paymentService).initiatePayment(1L, 900L, PaymentMethod.CARD, null);
    }

    @Test
    void initiatePayment_sameIdempotencyKey_returnsSamePayment() throws Exception {
        when(paymentService.initiatePayment(eq(1L), eq(900L), eq(PaymentMethod.UPI), eq("key-1")))
                .thenReturn(samplePayment());

        for (int i = 0; i < 2; i++) {
            mockMvc.perform(post("/payments")
                            .with(SecurityMockMvcRequestPostProcessors.authentication(auth(1L, Role.ROLE_CUSTOMER)))
                            .header("Idempotency-Key", "key-1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"orderId\":900,\"paymentMethod\":\"UPI\"}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.paymentId").value(100));
        }

        verify(paymentService, times(2)).initiatePayment(1L, 900L, PaymentMethod.UPI, "key-1");
    }

    @Test
    void getPayment_owner_returns200() throws Exception {
        when(paymentService.getPayment(1L, 100L)).thenReturn(samplePayment());

        mockMvc.perform(get("/payments/100")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(1L, Role.ROLE_CUSTOMER))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.paymentId").value(100));
    }

    @Test
    void getPayment_crossCustomer_forbidden() throws Exception {
        when(paymentService.getPayment(2L, 100L))
                .thenThrow(new ApiException(HttpStatus.FORBIDDEN, "You do not have permission to access this payment"));

        mockMvc.perform(get("/payments/100")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(2L, Role.ROLE_CUSTOMER))))
                .andExpect(status().isForbidden());
    }

    @Test
    void getPaymentByOrder_ownershipEnforced() throws Exception {
        when(paymentService.getPaymentByOrder(2L, 900L))
                .thenThrow(new ApiException(HttpStatus.FORBIDDEN, "You do not have permission to access this order"));

        mockMvc.perform(get("/payments/order/900")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(2L, Role.ROLE_CUSTOMER))))
                .andExpect(status().isForbidden());
    }

    @Test
    void getPaymentByOrder_owner_returns200() throws Exception {
        when(paymentService.getPaymentByOrder(1L, 900L)).thenReturn(samplePayment());

        mockMvc.perform(get("/payments/order/900")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(1L, Role.ROLE_CUSTOMER))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.orderId").value(900));
    }
}
