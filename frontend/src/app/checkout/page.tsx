import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { CheckoutView } from "@/components/checkout/CheckoutView";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Review and place your MarketHub order.",
};

/**
 * Checkout page. Shows the cart summary and places the order on
 * confirmation. Route is protected: guests are redirected to sign in.
 */
export default function CheckoutPage() {
  return (
    <RequireAuth>
      <CheckoutView />
    </RequireAuth>
  );
}
