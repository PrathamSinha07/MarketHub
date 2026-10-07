import type { Metadata } from "next";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = {
  title: "Cart",
  description: "Your MarketHub shopping cart.",
};

/**
 * Cart page shell. Cart functionality (sync, item management,
 * checkout) is implemented in a later task — for now the page
 * presents the empty state and points shoppers back to the catalog.
 */
export default function CartPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Your cart
      </h1>
      <div className="mt-6">
        <EmptyState
          title="Your cart is empty"
          message="Browse the marketplace and add products to your cart. Sign in to sync your cart across devices."
          actionHref="/products"
          actionLabel="Browse products"
        />
      </div>
    </div>
  );
}
