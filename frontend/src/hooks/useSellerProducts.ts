import { useEffect, useState } from "react";
import {
  productService,
  type GetSellerProductsParams,
} from "@/services/productService";
import { errorMessage } from "@/lib/api-client";
import type { ProductPage } from "@/types/product";

interface Result {
  key: string;
  page?: ProductPage;
  error?: string;
}

/**
 * Lists the signed-in seller's own products for the given parameters.
 *
 * Mirrors `useProducts`, but calls the seller-scoped endpoint
 * (`GET /products/seller`): the backend resolves ownership from the JWT,
 * so the list only ever contains the authenticated seller's products.
 *
 * `loading` is derived by comparing the current request key with the
 * key of the last settled request, so the UI can show a loading
 * state while a newer request is in flight without resetting state
 * synchronously inside an effect.
 */
export function useSellerProducts(params: GetSellerProductsParams = {}): {
  page?: ProductPage;
  loading: boolean;
  error?: string;
  reload: () => void;
} {
  const { page = 0, size = 20 } = params;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  const key = `${page}:${size}:${attempt}`;

  useEffect(() => {
    let active = true;

    productService
      .getSellerProducts({ page, size })
      .then((data) => {
        if (active) {
          setResult({ key, page: data });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setResult({ key, error: errorMessage(error) });
        }
      });

    return () => {
      active = false;
    };
  }, [page, size, attempt, key]);

  return {
    page: result?.page,
    loading: result === null || result.key !== key,
    error: result?.error,
    reload: () => setAttempt((value) => value + 1),
  };
}
