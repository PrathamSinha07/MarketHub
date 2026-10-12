import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { CustomerOrdersView } from "@/components/orders/CustomerOrdersView";

export const metadata: Metadata = {
  title: "My orders",
  description: "Your MarketHub order history.",
};

/**
 * Customer order-history page. Route is protected: guests are redirected
 * to sign in. Sellers/admins see an explanation — the order endpoints
 * are ROLE_CUSTOMER-only.
 */
export default function OrdersPage() {
  return (
    <RequireAuth>
      <CustomerOrdersView />
    </RequireAuth>
  );
}
