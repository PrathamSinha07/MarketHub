import { apiClient } from "@/lib/api-client";
import type { InitiatePaymentRequest, PaymentResponse } from "@/types/payment";

/**
 * Service for the Spring Boot payment API (`/payments`).
 * Requires an authenticated customer (JWT) — see `lib/session.ts`.
 * Not yet wired into the UI; prepared for the payments task.
 */
export const paymentService = {
  initiatePayment(
    request: InitiatePaymentRequest,
    idempotencyKey?: string
  ): Promise<PaymentResponse> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }
    return apiClient.post<PaymentResponse>("/payments", request, headers);
  },

  getPayment(paymentId: number): Promise<PaymentResponse> {
    return apiClient.get<PaymentResponse>(`/payments/${paymentId}`);
  },

  getPaymentByOrder(orderId: number): Promise<PaymentResponse> {
    return apiClient.get<PaymentResponse>(`/payments/order/${orderId}`);
  },
};
