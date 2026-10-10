"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { cartService } from "@/services/cartService";
import { errorMessage } from "@/lib/api-client";
import type { CartResponse } from "@/types/cart";

interface CartContextValue {
  /** The customer's cart, or undefined when unavailable/not loaded. */
  cart?: CartResponse;
  /** True while a cart request is in flight. */
  loading: boolean;
  /** Error message from the last failed cart request. */
  error?: string;
  /**
   * True when a user is signed in but their role cannot access the
   * customer cart endpoints (seller/admin). The UI should explain
   * this instead of surfacing a raw 403.
   */
  restricted: boolean;
  /** Total item quantity across the cart (0 when unavailable). */
  count: number;
  /** Re-fetches the cart from the API. */
  refresh: () => void;
  /** Applies a cart payload returned by a cart mutation (no refetch). */
  applyCart: (cart: CartResponse) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

interface Result {
  key: string;
  cart?: CartResponse;
  error?: string;
}

/**
 * Loads and exposes the signed-in customer's cart.
 *
 * Only `ROLE_CUSTOMER` accounts may call the cart endpoints (the
 * backend answers 403 for everyone else), so the fetch is gated on the
 * authenticated role and skipped entirely for guests. Mutations across
 * the app push their responses back in via `applyCart` so the navbar
 * count stays in sync without extra requests.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const { user, restoring } = useAuth();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  const userId = user?.userId;
  const canLoad = !restoring && user?.role === "ROLE_CUSTOMER";
  const key = canLoad && userId !== undefined ? `${userId}:${attempt}` : "";

  useEffect(() => {
    if (key === "") {
      // Guests and non-customer roles never get a cart payload; any
      // previously stored result is ignored by the derived state below.
      return;
    }

    let active = true;
    cartService
      .getCart()
      .then((cart) => {
        if (active) {
          setResult({ key, cart });
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
  }, [key]);

  const applyCart = useCallback(
    (cart: CartResponse) => {
      setResult({ key, cart });
    },
    [key]
  );

  const refresh = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    // Only a result matching the current request key is surfaced, so
    // stale payloads (e.g. after sign-out) are ignored without an
    // effect-driven reset.
    const current =
      result !== null && key !== "" && result.key === key ? result : undefined;
    const cart = current?.cart;
    const loading = key !== "" && current === undefined;
    const count =
      cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

    return {
      cart,
      loading,
      error: current?.error,
      restricted: !restoring && user !== null && user.role !== "ROLE_CUSTOMER",
      count,
      refresh,
      applyCart,
    };
  }, [result, key, restoring, user, refresh, applyCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/** Accesses the shared cart state and mutation helpers. */
export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (context === null) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
