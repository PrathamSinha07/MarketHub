import { apiClient } from "@/lib/api-client";
import type { Product, ProductPage, ProductRequest } from "@/types/product";

export interface GetProductsParams {
  categoryId?: number;
  page?: number;
  size?: number;
}

export interface GetSellerProductsParams {
  page?: number;
  size?: number;
}

function toQuery(params: GetProductsParams): string {
  const searchParams = new URLSearchParams();
  if (params.categoryId !== undefined) {
    searchParams.set("categoryId", String(params.categoryId));
  }
  if (params.page !== undefined) {
    searchParams.set("page", String(params.page));
  }
  if (params.size !== undefined) {
    searchParams.set("size", String(params.size));
  }
  const query = searchParams.toString();
  return query === "" ? "" : `?${query}`;
}

/** Service for the Spring Boot product API (`/products`). */
export const productService = {
  /**
   * Lists active products, optionally filtered by category (newest first).
   *
   * NOTE: this is the public marketplace catalog — it returns every
   * seller's ACTIVE products, not the caller's own.
   */
  getProducts(params: GetProductsParams = {}): Promise<ProductPage> {
    return apiClient.get<ProductPage>(`/products${toQuery(params)}`);
  },

  /**
   * Lists the signed-in seller's own products (ROLE_SELLER required).
   * The backend derives seller ownership from the JWT and returns every
   * status (draft, active, archived) — no seller id is sent from the
   * client, and other sellers' products are never included.
   */
  getSellerProducts(params: GetSellerProductsParams = {}): Promise<ProductPage> {
    return apiClient.get<ProductPage>(`/products/seller${toQuery(params)}`);
  },

  getProductById(id: number): Promise<Product> {
    return apiClient.get<Product>(`/products/${id}`);
  },

  /**
   * Creates a product for the signed-in seller (ROLE_SELLER required).
   * The backend derives seller ownership from the JWT — no seller id
   * is sent from the client.
   */
  createProduct(request: ProductRequest): Promise<Product> {
    return apiClient.post<Product>("/products", request);
  },

  /**
   * Updates the signed-in seller's product (ROLE_SELLER required).
   * The backend re-derives ownership from the JWT: updating another
   * seller's product by id fails with 403. Product status is never
   * changed by this endpoint (archived products stay archived).
   */
  updateProduct(id: number, request: ProductRequest): Promise<Product> {
    return apiClient.put<Product>(`/products/${id}`, request);
  },

  /**
   * Archives the signed-in seller's product (ROLE_SELLER required).
   * Archived products disappear from the public catalog and cannot be
   * added to carts. Ownership is enforced on the backend.
   */
  archiveProduct(id: number): Promise<void> {
    return apiClient.del<void>(`/products/${id}`);
  },
};
