import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "Cart",
  description: "Your MarketHub shopping cart.",
};

/**
 * Shopping cart page. Route is protected: guests are redirected to
 * sign in with a `next` return URL. Signed-in non-customer roles see
 * an explanation instead of a raw 403 (cart endpoints are
 * ROLE_CUSTOMER-only). Items, quantity updates, removal and checkout
 * are handled in `CartView` against the existing cart/order APIs.
 */
export default function CartPage() {
  return (
    <RequireAuth>
      <CartView />
    </RequireAuth>
  );
}
