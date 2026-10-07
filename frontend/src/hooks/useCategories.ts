import { useEffect, useState } from "react";
import { categoryService } from "@/services/categoryService";
import { errorMessage } from "@/lib/api-client";
import type { Category } from "@/types/category";

export interface AsyncState<T> {
  data?: T;
  loading: boolean;
  error?: string;
}

/**
 * Loads the root categories.
 *
 * State transitions happen exclusively inside the fetch callbacks;
 * `loading` is derived from whether a request has settled.
 */
export function useCategories(): AsyncState<Category[]> & {
  reload: () => void;
} {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    data?: Category[];
    error?: string;
  } | null>(null);

  useEffect(() => {
    let active = true;

    categoryService
      .getRootCategories()
      .then((data) => {
        if (active) {
          setResult({ data });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setResult({ error: errorMessage(error) });
        }
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  return {
    data: result?.data,
    loading: result === null,
    error: result?.error,
    reload: () => setAttempt((value) => value + 1),
  };
}
