import { apiClient } from "@/lib/api-client";
import type { InitiatePaymentRequest, PaymentResponse } from "@/types/payment";

/**
 * Service for the Spring Boot payment API (`/payments`).
 * Requires an authenticated customer (JWT) — see `lib/session.ts`.
 *
 * Payment processing is intentionally incomplete: payments can be initiated
 * and read, but no gateway is integrated, so they stay PENDING. The order
 * history uses `getPayments()` to show that state honestly.
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

  /** All payments belonging to the signed-in customer. */
  getPayments(): Promise<PaymentResponse[]> {
    return apiClient.get<PaymentResponse[]>("/payments");
  },
};
