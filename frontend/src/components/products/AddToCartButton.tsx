"use client";

import { useState } from "react";
import Link from "next/link";
import { cartService } from "@/services/cartService";
import { errorMessage } from "@/lib/api-client";
import { getAuthToken } from "@/lib/session";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  productId: number;
  quantity: number;
  disabled?: boolean;
}

type Notice =
  | { kind: "none" }
  | { kind: "auth-required" }
  | { kind: "added" }
  | { kind: "error"; message: string };

/**
 * Add-to-cart button wired to the cart service layer.
 *
 * Reads the authentication session at click time: without one the
 * button prompts the user to sign in, otherwise the service call runs
 * with the stored token attached by the API client.
 */
export function AddToCartButton({
  productId,
  quantity,
  disabled,
}: AddToCartButtonProps) {
  const [notice, setNotice] = useState<Notice>({ kind: "none" });
  const [submitting, setSubmitting] = useState(false);

  async function handleAddToCart() {
    const token = getAuthToken();
    if (!token) {
      setNotice({ kind: "auth-required" });
      return;
    }

    setSubmitting(true);
    setNotice({ kind: "none" });
    try {
      await cartService.addToCart({ productId, quantity });
      setNotice({ kind: "added" });
    } catch (error) {
      setNotice({ kind: "error", message: errorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={disabled || submitting}
        className={cn(
          "w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors",
          "hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        )}
      >
        {submitting ? "Adding…" : "Add to cart"}
      </button>

      {notice.kind === "auth-required" && (
        <p className="mt-3 rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
          <Link
            href="/login"
            className="font-medium text-indigo-600 hover:underline"
          >
            Sign in
          </Link>{" "}
          to add products to your cart.
        </p>
      )}
      {notice.kind === "added" && (
        <p className="mt-3 text-sm font-medium text-emerald-600">
          Added to your cart.
        </p>
      )}
      {notice.kind === "error" && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {notice.message}
        </p>
      )}
    </div>
  );
}
