import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductsBrowser } from "@/components/products/ProductsBrowser";
import { ProductsBrowserSkeleton } from "@/components/products/ProductsBrowserSkeleton";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse all products listed on the MarketHub marketplace.",
};

export default function ProductsPage(props: PageProps<"/products">) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          All products
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Browse the full marketplace catalog.
        </p>
      </header>

      <Suspense fallback={<ProductsBrowserSkeleton />}>
        <ProductsPageContent {...props} />
      </Suspense>
    </div>
  );
}

async function ProductsPageContent(props: PageProps<"/products">) {
  const searchParams = await props.searchParams;
  const rawCategoryId = searchParams.categoryId;
  const categoryId =
    typeof rawCategoryId === "string" && /^\d+$/.test(rawCategoryId)
      ? Number(rawCategoryId)
      : undefined;

  return <ProductsBrowser initialCategoryId={categoryId} />;
}
