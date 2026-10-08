import type { Metadata } from "next";
import { SellerProductsView } from "@/components/seller/SellerProductsView";

export const metadata: Metadata = {
  title: "Products",
  description: "Manage your products on the MarketHub marketplace.",
};

export default function SellerProductsPage() {
  return <SellerProductsView />;
}
