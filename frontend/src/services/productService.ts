import { apiClient } from "@/lib/api-client";
import type { Product, ProductPage, ProductRequest } from "@/types/product";

export interface GetProductsParams {
  categoryId?: number;
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
   * seller's ACTIVE products, not the caller's own. The backend does
   * not currently expose a seller-scoped product listing endpoint.
   */
  getProducts(params: GetProductsParams = {}): Promise<ProductPage> {
    return apiClient.get<ProductPage>(`/products${toQuery(params)}`);
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
};
