/** Matches `CategoryResponse` from the backend. */
export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  subCategories: Category[] | null;
}
