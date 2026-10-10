import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { CategorySection } from "@/components/home/CategorySection";
import { FeaturedProductsSection } from "@/components/home/FeaturedProductsSection";
import { ValueSection } from "@/components/home/ValueSection";
import { SellCta } from "@/components/home/SellCta";
import { container } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Multi-vendor marketplace",
  description:
    "Browse products from independent sellers on MarketHub. Compare offerings, check live stock, and place orders in one place.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <div className={`${container} space-y-14 py-12 sm:py-16`}>
        <CategorySection />
        <FeaturedProductsSection />
        <ValueSection />
      </div>
      <SellCta />
    </>
  );
}
