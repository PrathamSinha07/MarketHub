import { apiClient } from "@/lib/api-client";
import type {
  AddToCartRequest,
  CartResponse,
  UpdateCartItemRequest,
} from "@/types/cart";

/**
 * Service for the Spring Boot cart API (`/cart`).
 * Requires an authenticated customer (JWT) — see `lib/session.ts`.
 * Wired into `CartContext`, the cart page, add-to-cart and checkout.
 */
export const cartService = {
  getCart(): Promise<CartResponse> {
    return apiClient.get<CartResponse>("/cart");
  },

  addToCart(request: AddToCartRequest): Promise<CartResponse> {
    return apiClient.post<CartResponse>("/cart/items", request);
  },

  updateCartItem(cartItemId: number, request: UpdateCartItemRequest): Promise<CartResponse> {
    return apiClient.put<CartResponse>(`/cart/items/${cartItemId}`, request);
  },

  removeCartItem(cartItemId: number): Promise<CartResponse> {
    return apiClient.del<CartResponse>(`/cart/items/${cartItemId}`);
  },

  clearCart(): Promise<CartResponse> {
    return apiClient.del<CartResponse>("/cart");
  },
};
