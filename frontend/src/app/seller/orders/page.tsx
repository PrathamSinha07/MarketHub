import type { Metadata } from "next";
import { SellerOrdersView } from "@/components/seller/SellerOrdersView";

export const metadata: Metadata = {
  title: "Orders",
  description: "Orders containing your products.",
};

/**
 * Seller orders page. Shows order items containing the seller's products,
 * sourced from `GET /orders/seller`.
 */
export default function SellerOrdersPage() {
  return <SellerOrdersView />;
}
