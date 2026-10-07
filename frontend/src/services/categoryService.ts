import { apiClient } from "@/lib/api-client";
import type { Category } from "@/types/category";

/** Service for the Spring Boot category API (`/categories`). */
export const categoryService = {
  /** Root categories (parent is null), each including its subcategories. */
  getRootCategories(): Promise<Category[]> {
    return apiClient.get<Category[]>("/categories");
  },

  getCategoryById(id: number): Promise<Category> {
    return apiClient.get<Category>(`/categories/${id}`);
  },

  getSubCategories(id: number): Promise<Category[]> {
    return apiClient.get<Category[]>(`/categories/${id}/subcategories`);
  },
};
