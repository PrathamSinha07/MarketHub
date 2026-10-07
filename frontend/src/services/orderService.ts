import { apiClient } from "@/lib/api-client";
import type { OrderResponse, SellerOrderItemResponse } from "@/types/order";

/**
 * Service for the Spring Boot order API (`/orders`).
 * Requires an authenticated user (JWT) — see `lib/session.ts`.
 * Not yet wired into the UI; prepared for the checkout task.
 */
export const orderService = {
  checkout(): Promise<OrderResponse> {
    return apiClient.post<OrderResponse>("/orders/checkout");
  },

  getCustomerOrders(): Promise<OrderResponse[]> {
    return apiClient.get<OrderResponse[]>("/orders");
  },

  getOrderById(orderId: number): Promise<OrderResponse> {
    return apiClient.get<OrderResponse>(`/orders/${orderId}`);
  },

  getSellerOrderItems(): Promise<SellerOrderItemResponse[]> {
    return apiClient.get<SellerOrderItemResponse[]>("/orders/seller");
  },
};
