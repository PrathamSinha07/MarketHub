import { useEffect, useState } from "react";
import { orderService } from "@/services/orderService";
import { errorMessage } from "@/lib/api-client";
import type { SellerOrderItemResponse } from "@/types/order";
import type { AsyncState } from "@/hooks/useCategories";

/**
 * Loads the signed-in seller's order items (`GET /orders/seller`).
 *
 * Follows the same pattern as `useCategories`: state transitions only
 * happen inside the fetch callbacks, `loading` reflects whether the
 * current request has settled.
 */
export function useSellerOrderItems(): AsyncState<SellerOrderItemResponse[]> & {
  reload: () => void;
} {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    data?: SellerOrderItemResponse[];
    error?: string;
  } | null>(null);

  useEffect(() => {
    let active = true;

    orderService
      .getSellerOrderItems()
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
