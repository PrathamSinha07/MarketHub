package com.markethub.modules.cart.service;

import com.markethub.modules.cart.dto.AddToCartRequest;
import com.markethub.modules.cart.dto.CartResponse;
import com.markethub.modules.cart.dto.UpdateCartItemRequest;

public interface CartService {

    CartResponse getCart(Long userId);

    CartResponse addToCart(Long userId, AddToCartRequest request);

    CartResponse updateCartItem(Long userId, Long cartItemId, UpdateCartItemRequest request);

    CartResponse removeItem(Long userId, Long cartItemId);

    CartResponse clearCart(Long userId);
}
