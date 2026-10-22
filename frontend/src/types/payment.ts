export type PaymentMethod = "CARD" | "UPI" | "NET_BANKING" | "WALLET" | "COD";

export type PaymentStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "CAPTURED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

/** Matches `InitiatePaymentRequest` from the backend. */
export interface InitiatePaymentRequest {
  orderId: number;
  paymentMethod: PaymentMethod;
}

/** Matches `PaymentResponse` from the backend. */
export interface PaymentResponse {
  paymentId: number;
  orderId: number;
  userId: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: string;
  paymentReference: string;
  /** Null while no real gateway is integrated (the no-op gateway). */
  gatewayReferenceId: string | null;
  createdAt: string;
}
