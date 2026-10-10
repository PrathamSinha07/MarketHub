"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { cartService } from "@/services/cartService";
import { errorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  productId: number;
  quantity: number;
  disabled?: boolean;
}

type Notice =
  | { kind: "none" }
  | { kind: "auth-required" }
  | { kind: "role-restricted" }
  | { kind: "added" }
  | { kind: "error"; message: string };

/**
 * Add-to-cart button wired to the cart service layer.
 *
 * Behaviour depends on the session: guests are prompted to sign in,
 * signed-in non-customer roles (seller/admin) get an explanation
 * instead of a raw 403, and customer additions push the returned cart
 * into the shared cart context so the navbar count updates at once.
 */
export function AddToCartButton({
  productId,
  quantity,
  disabled,
}: AddToCartButtonProps) {
  const [notice, setNotice] = useState<Notice>({ kind: "none" });
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { applyCart } = useCart();
  const pathname = usePathname();

  async function handleAddToCart() {
    if (!user) {
      setNotice({ kind: "auth-required" });
      return;
    }
    if (user.role !== "ROLE_CUSTOMER") {
      setNotice({ kind: "role-restricted" });
      return;
    }

    setSubmitting(true);
    setNotice({ kind: "none" });
    try {
      const cart = await cartService.addToCart({ productId, quantity });
      applyCart(cart);
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
            href={`/login?next=${encodeURIComponent(pathname)}`}
            className="font-medium text-indigo-600 hover:underline"
          >
            Sign in
          </Link>{" "}
          with a customer account to add products to your cart.
        </p>
      )}
      {notice.kind === "role-restricted" && (
        <p className="mt-3 rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
          {user?.role === "ROLE_SELLER"
            ? "Seller accounts don't include a shopping cart. Sign in with a customer account to buy."
            : "This account doesn't include a shopping cart. Sign in with a customer account to buy."}
        </p>
      )}
      {notice.kind === "added" && (
        <p
          className="mt-3 text-sm font-medium text-emerald-600"
          role="status"
        >
          Added to your cart.{" "}
          <Link href="/cart" className="font-semibold text-indigo-600 hover:underline">
            View cart
          </Link>
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
