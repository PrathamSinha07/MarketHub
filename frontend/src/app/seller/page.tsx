import type { Metadata } from "next";
import { SellerOverview } from "@/components/seller/SellerOverview";

export const metadata: Metadata = {
  title: "Seller dashboard",
  description: "Overview of your MarketHub seller account.",
};

export default function SellerDashboardPage() {
  return <SellerOverview />;
}
