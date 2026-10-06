package com.markethub.modules.payment.controller;

import com.markethub.common.exception.ApiException;
import com.markethub.common.exception.ResourceNotFoundException;
import com.markethub.modules.payment.dto.PaymentResponse;
import com.markethub.modules.payment.entity.PaymentMethod;
import com.markethub.modules.payment.entity.PaymentStatus;
import com.markethub.modules.payment.service.PaymentService;
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
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PaymentWebhookController.class, excludeAutoConfiguration = org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class PaymentWebhookControllerTest {

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

    private static final String VALID_BODY =
            "{\"paymentReference\":\"gw-123\",\"status\":\"CAPTURED\",\"eventId\":\"evt-1\",\"signature\":\"sig-abc\"}";

    @Test
    void webhook_noCustomerAuth_notRejectedBySecurity() throws Exception {
        PaymentResponse response = new PaymentResponse(100L, 900L, 1L, PaymentMethod.CARD, PaymentStatus.CAPTURED,
                new BigDecimal("39.98"), "INR", "PAY-1", "gw-123", null);
        when(paymentService.processWebhook(any())).thenReturn(response);

        mockMvc.perform(post("/payments/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("CAPTURED"));
    }

    @Test
    void webhook_invalidSignature_rejected() throws Exception {
        when(paymentService.processWebhook(any()))
                .thenThrow(new ApiException(HttpStatus.FORBIDDEN, "Webhook verification failed"));

        mockMvc.perform(post("/payments/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isForbidden());
    }

    @Test
    void webhook_missingSignature_rejected() throws Exception {
        when(paymentService.processWebhook(any()))
                .thenThrow(new ApiException(HttpStatus.BAD_REQUEST, "Missing webhook signature"));

        mockMvc.perform(post("/payments/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"paymentReference\":\"gw-123\",\"status\":\"CAPTURED\",\"eventId\":\"evt-1\",\"signature\":\" \"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void webhook_unknownPaymentReference_handledSafely() throws Exception {
        when(paymentService.processWebhook(any()))
                .thenThrow(new ResourceNotFoundException("Payment", "reference", "gw-123"));

        mockMvc.perform(post("/payments/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isNotFound());
    }

    @Test
    void webhook_invalidTransition_rejected() throws Exception {
        when(paymentService.processWebhook(any()))
                .thenThrow(new ApiException(HttpStatus.BAD_REQUEST, "Invalid payment status transition"));

        mockMvc.perform(post("/payments/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isBadRequest());
    }

    @Test
    void webhook_duplicateEvent_harmless() throws Exception {
        PaymentResponse response = new PaymentResponse(100L, 900L, 1L, PaymentMethod.CARD, PaymentStatus.CAPTURED,
                new BigDecimal("39.98"), "INR", "PAY-1", "gw-123", null);
        when(paymentService.processWebhook(any())).thenReturn(response);

        for (int i = 0; i < 2; i++) {
            mockMvc.perform(post("/payments/webhook")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(VALID_BODY))
                    .andExpect(status().isOk());
        }
    }
}
