package com.markethub.modules.payment.controller;

import com.markethub.common.response.ApiResponse;
import com.markethub.modules.payment.dto.PaymentResponse;
import com.markethub.modules.payment.dto.PaymentWebhookRequest;
import com.markethub.modules.payment.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/payments/webhook")
public class PaymentWebhookController {

    private final PaymentService paymentService;

    public PaymentWebhookController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PaymentResponse>> handleWebhook(
            @Valid @RequestBody PaymentWebhookRequest request
    ) {
        PaymentResponse response = paymentService.processWebhook(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Webhook processed"));
    }
}
