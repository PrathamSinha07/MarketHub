"use client";

import { useState } from "react";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductGridSkeleton } from "@/components/products/ProductGridSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { cn } from "@/lib/utils";

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-indigo-600 bg-indigo-600 text-white"
          : "border-zinc-300 bg-white text-zinc-700 hover:border-indigo-300 hover:text-indigo-600"
      )}
    >
      {label}
    </button>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <nav
      aria-label="Product pages"
      className="flex items-center justify-center gap-4 pt-8"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 0}
        className="rounded-md border border-zinc-300 px-3.5 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Previous
      </button>
      <span className="text-sm text-zinc-500">
        Page {page + 1} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1}
        className="rounded-md border border-zinc-300 px-3.5 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </nav>
  );
}

export function ProductsBrowser({
  initialCategoryId,
}: {
  initialCategoryId?: number;
}) {
  const [categoryId, setCategoryId] = useState<number | undefined>(
    initialCategoryId
  );
  const [page, setPage] = useState(0);

  const { data: categories } = useCategories();
  const {
    page: productPage,
    loading,
    error,
    reload,
  } = useProducts({ categoryId, page, size: 12 });

  const selectCategory = (id?: number) => {
    setCategoryId(id);
    setPage(0);
  };

  return (
    <div className="space-y-6">
      <section aria-label="Filter by category">
        <div className="flex flex-wrap gap-2">
          <Chip
            label="All products"
            active={categoryId === undefined}
            onClick={() => selectCategory(undefined)}
          />
          {(categories ?? []).map((category) => (
            <Chip
              key={category.id}
              label={category.name}
              active={categoryId === category.id}
              onClick={() => selectCategory(category.id)}
            />
          ))}
        </div>
      </section>

      {loading && <ProductGridSkeleton count={8} />}

      {error && !loading && (
        <ErrorState
          title="Products unavailable"
          message={error}
          onRetry={reload}
        />
      )}

      {!loading && !error && productPage && (
        productPage.content.length === 0 ? (
          <EmptyState
            title="No products found"
            message={
              categoryId !== undefined
                ? "No products are listed in this category yet."
                : "No products are listed on the marketplace yet."
            }
            actionHref="/"
            actionLabel="Back to home"
          />
        ) : (
          <>
            <p className="text-sm text-zinc-500">
              {productPage.totalElements}{" "}
              {productPage.totalElements === 1 ? "product" : "products"}
              {categoryId !== undefined ? " in this category" : ""} found
            </p>
            <ProductGrid products={productPage.content} />
            {productPage.totalPages > 1 && (
              <Pagination
                page={productPage.number}
                totalPages={productPage.totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        )
      )}
    </div>
  );
}
