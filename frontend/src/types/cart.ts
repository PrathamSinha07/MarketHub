/** Matches `CartItemResponse` from the backend. */
export interface CartItemResponse {
  cartItemId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

/** Matches `CartResponse` from the backend. */
export interface CartResponse {
  cartId: number;
  items: CartItemResponse[];
  subtotal: number;
}

/** Matches `AddToCartRequest` from the backend. */
export interface AddToCartRequest {
  productId: number;
  quantity: number;
}

/** Matches `UpdateCartItemRequest` from the backend. */
export interface UpdateCartItemRequest {
  quantity: number;
}
