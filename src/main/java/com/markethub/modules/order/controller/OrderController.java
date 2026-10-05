package com.markethub.modules.order.controller;

import com.markethub.common.response.ApiResponse;
import com.markethub.modules.order.dto.OrderResponse;
import com.markethub.modules.order.dto.SellerOrderItemResponse;
import com.markethub.modules.order.service.OrderService;
import com.markethub.security.CustomUserDetails;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/checkout")
    @PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
    public ResponseEntity<ApiResponse<OrderResponse>> checkout(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        OrderResponse response = orderService.checkout(userDetails.getUser().getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Order placed successfully"));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getCustomerOrders(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<OrderResponse> response = orderService.getCustomerOrders(userDetails.getUser().getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Orders retrieved successfully"));
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long orderId
    ) {
        OrderResponse response = orderService.getOrderById(userDetails.getUser().getId(), orderId);
        return ResponseEntity.ok(ApiResponse.success(response, "Order retrieved successfully"));
    }

    @GetMapping("/seller")
    @PreAuthorize("hasAuthority('ROLE_SELLER')")
    public ResponseEntity<ApiResponse<List<SellerOrderItemResponse>>> getSellerOrderItems(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<SellerOrderItemResponse> response = orderService.getSellerOrderItems(userDetails.getUser().getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Seller order items retrieved successfully"));
    }
}
