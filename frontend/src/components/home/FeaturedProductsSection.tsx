"use client";

import { useProducts } from "@/hooks/useProducts";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductGridSkeleton } from "@/components/products/ProductGridSkeleton";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";

export function FeaturedProductsSection() {
  const { page, loading, error, reload } = useProducts({
    page: 0,
    size: 8,
  });

  return (
    <section aria-labelledby="featured-heading">
      <SectionHeader
        title="Featured products"
        description="New arrivals from sellers on the marketplace."
        actionHref="/products"
        actionLabel="View all products"
      />

      {loading && <ProductGridSkeleton count={8} />}

      {error && !loading && (
        <ErrorState
          title="Products unavailable"
          message={error}
          onRetry={reload}
        />
      )}

      {!loading && !error && page && (
        page.content.length === 0 ? (
          <EmptyState
            title="No products yet"
            message="Sellers are still listing their first products. Check back soon."
            actionHref="/products"
            actionLabel="Browse products"
          />
        ) : (
          <ProductGrid products={page.content} />
        )
      )}
    </section>
  );
}
