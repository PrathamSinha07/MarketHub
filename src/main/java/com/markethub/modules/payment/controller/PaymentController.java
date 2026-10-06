package com.markethub.modules.payment.controller;

import com.markethub.common.response.ApiResponse;
import com.markethub.modules.payment.dto.InitiatePaymentRequest;
import com.markethub.modules.payment.dto.PaymentResponse;
import com.markethub.modules.payment.service.PaymentService;
import com.markethub.security.CustomUserDetails;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
    public ResponseEntity<ApiResponse<PaymentResponse>> initiatePayment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody InitiatePaymentRequest request,
            @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        PaymentResponse response = paymentService.initiatePayment(
                userDetails.getUser().getId(), request.getOrderId(), request.getPaymentMethod(), idempotencyKey);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Payment initiated successfully"));
    }

    @GetMapping("/{paymentId}")
    @PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPayment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long paymentId
    ) {
        PaymentResponse response = paymentService.getPayment(userDetails.getUser().getId(), paymentId);
        return ResponseEntity.ok(ApiResponse.success(response, "Payment retrieved successfully"));
    }

    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentByOrder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long orderId
    ) {
        PaymentResponse response = paymentService.getPaymentByOrder(userDetails.getUser().getId(), orderId);
        return ResponseEntity.ok(ApiResponse.success(response, "Payment retrieved successfully"));
    }
}
