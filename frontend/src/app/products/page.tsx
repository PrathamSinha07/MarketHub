import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductsBrowser } from "@/components/products/ProductsBrowser";
import { ProductsBrowserSkeleton } from "@/components/products/ProductsBrowserSkeleton";
import { container } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse all products listed on the MarketHub marketplace.",
};

export default function ProductsPage(props: PageProps<"/products">) {
  return (
    <div className={container}>
      <div className="py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            All products
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Browse the full marketplace catalog, filter by category, or search
            by product and seller.
          </p>
        </header>

        <Suspense fallback={<ProductsBrowserSkeleton />}>
          <ProductsPageContent {...props} />
        </Suspense>
      </div>
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
  const rawQuery = searchParams.q;
  const query =
    typeof rawQuery === "string" ? rawQuery.slice(0, 100) : undefined;

  // Remount when the URL params change so a navbar search performed on
  // this page resets the browser's local state to the new query.
  return (
    <ProductsBrowser
      key={`${categoryId ?? "all"}:${query ?? ""}`}
      initialCategoryId={categoryId}
      initialQuery={query}
    />
  );
}
