export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

/** Matches `OrderItemResponse` from the backend. */
export interface OrderItemResponse {
  orderItemId: number;
  productId: number;
  sellerId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

/** Matches `OrderResponse` from the backend. */
export interface OrderResponse {
  orderId: number;
  userId: number;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItemResponse[];
  createdAt: string;
}

/** Matches `SellerOrderItemResponse` from the backend. */
export interface SellerOrderItemResponse {
  orderId: number;
  orderItemId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  orderStatus: OrderStatus;
  orderCreatedAt: string;
}
