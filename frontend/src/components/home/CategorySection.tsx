"use client";

import { useCategories } from "@/hooks/useCategories";
import { CategoryCard } from "@/components/categories/CategoryCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";

function CategoryGridSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3"
      aria-hidden="true"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-24 rounded-lg border border-zinc-200 bg-white p-5"
        >
          <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-200" />
          <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-zinc-200" />
        </div>
      ))}
    </div>
  );
}

export function CategorySection() {
  const { data: categories, loading, error, reload } = useCategories();

  return (
    <section id="categories" aria-labelledby="categories-heading">
      <SectionHeader
        title="Shop by category"
        description="Browse the marketplace by department."
      />

      {loading && <CategoryGridSkeleton />}

      {error && !loading && (
        <ErrorState
          title="Categories unavailable"
          message={error}
          onRetry={reload}
        />
      )}

      {!loading && !error && categories && (
        categories.length === 0 ? (
          <EmptyState
            title="No categories yet"
            message="Marketplace categories are still being set up. Check back soon."
            actionHref="/products"
            actionLabel="Browse products"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )
      )}
    </section>
  );
}
