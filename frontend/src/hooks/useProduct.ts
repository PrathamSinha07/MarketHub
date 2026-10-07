import { useEffect, useState } from "react";
import { productService } from "@/services/productService";
import { errorMessage } from "@/lib/api-client";
import type { Product } from "@/types/product";

interface Result {
  key: number;
  product?: Product;
  error?: string;
}

/**
 * Loads a single product by id.
 *
 * `loading` is derived by comparing the requested id with the id of
 * the last settled request. A null id (invalid route value) skips
 * the fetch and reports no loading state.
 */
export function useProduct(
  productId: number | null
): {
  product?: Product;
  loading: boolean;
  error?: string;
  reload: () => void;
} {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (productId === null) {
      return;
    }

    let active = true;

    productService
      .getProductById(productId)
      .then((product) => {
        if (active) {
          setResult({ key: productId, product });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setResult({ key: productId, error: errorMessage(error) });
        }
      });

    return () => {
      active = false;
    };
  }, [productId, attempt]);

  if (productId === null) {
    return { loading: false, reload: () => setAttempt((value) => value + 1) };
  }

  return {
    product: result?.product,
    loading: result === null || result.key !== productId,
    error: result?.error,
    reload: () => setAttempt((value) => value + 1),
  };
}
