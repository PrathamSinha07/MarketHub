import { apiClient } from "@/lib/api-client";
import type { Product, ProductPage } from "@/types/product";

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
  /** Lists active products, optionally filtered by category (newest first). */
  getProducts(params: GetProductsParams = {}): Promise<ProductPage> {
    return apiClient.get<ProductPage>(`/products${toQuery(params)}`);
  },

  getProductById(id: number): Promise<Product> {
    return apiClient.get<Product>(`/products/${id}`);
  },
};
