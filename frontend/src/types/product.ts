export type ProductStatus = "DRAFT" | "ACTIVE" | "OUT_OF_STOCK" | "ARCHIVED";

/** Matches `ProductResponse` from the backend. `sellerName` is the seller's store name. */
export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  stockQuantity: number;
  status: ProductStatus;
  sellerId: number;
  sellerName?: string;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
}

/** Spring Data page returned by GET /products. */
export interface ProductPage {
  content: Product[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements?: number;
}
