package com.markethub.modules.cart.controller;

import com.markethub.common.response.ApiResponse;
import com.markethub.modules.cart.dto.AddToCartRequest;
import com.markethub.modules.cart.dto.CartResponse;
import com.markethub.modules.cart.dto.UpdateCartItemRequest;
import com.markethub.modules.cart.service.CartService;
import com.markethub.security.CustomUserDetails;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
    public ResponseEntity<ApiResponse<CartResponse>> getCart(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        CartResponse response = cartService.getCart(userDetails.getUser().getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Cart retrieved successfully"));
    }

    @PostMapping("/items")
    @PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
    public ResponseEntity<ApiResponse<CartResponse>> addToCart(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AddToCartRequest request
    ) {
        CartResponse response = cartService.addToCart(userDetails.getUser().getId(), request);
        return ResponseEntity.ok(ApiResponse.success(response, "Product added to cart"));
    }

    @PutMapping("/items/{cartItemId}")
    @PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
    public ResponseEntity<ApiResponse<CartResponse>> updateCartItem(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long cartItemId,
            @Valid @RequestBody UpdateCartItemRequest request
    ) {
        CartResponse response = cartService.updateCartItem(userDetails.getUser().getId(), cartItemId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cart item updated"));
    }

    @DeleteMapping("/items/{cartItemId}")
    @PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
    public ResponseEntity<ApiResponse<CartResponse>> removeItem(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long cartItemId
    ) {
        CartResponse response = cartService.removeItem(userDetails.getUser().getId(), cartItemId);
        return ResponseEntity.ok(ApiResponse.success(response, "Item removed from cart"));
    }

    @DeleteMapping
    @PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
    public ResponseEntity<ApiResponse<CartResponse>> clearCart(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        CartResponse response = cartService.clearCart(userDetails.getUser().getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Cart cleared"));
    }
}
