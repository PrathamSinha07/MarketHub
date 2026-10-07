import { useEffect, useState } from "react";
import { categoryService } from "@/services/categoryService";
import type { Category } from "@/types/category";

interface Result {
  key: number;
  category?: Category;
}

/**
 * Loads a category by id for display purposes.
 *
 * Category names are secondary on the product details page, so a
 * failed lookup falls back to showing the raw category id instead
 * of an error. `loading` is derived from the settled request key.
 */
export function useCategory(
  categoryId: number | null | undefined
): { category?: Category; loading: boolean } {
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (categoryId == null) {
      return;
    }

    let active = true;

    categoryService
      .getCategoryById(categoryId)
      .then((category) => {
        if (active) {
          setResult({ key: categoryId, category });
        }
      })
      .catch(() => {
        // Fall back to the raw category id in the UI.
        if (active) {
          setResult({ key: categoryId });
        }
      });

    return () => {
      active = false;
    };
  }, [categoryId]);

  if (categoryId == null) {
    return { loading: false };
  }

  return {
    category: result?.category,
    loading: result === null || result.key !== categoryId,
  };
}
