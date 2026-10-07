import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { CategorySection } from "@/components/home/CategorySection";
import { FeaturedProductsSection } from "@/components/home/FeaturedProductsSection";
import { SellCta } from "@/components/home/SellCta";

export const metadata: Metadata = {
  title: "Multi-vendor marketplace",
  description:
    "Browse products from independent sellers on MarketHub. Compare offerings, check live stock, and place orders in one place.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 lg:px-8">
        <CategorySection />
        <FeaturedProductsSection />
      </div>
      <SellCta />
    </>
  );
}
