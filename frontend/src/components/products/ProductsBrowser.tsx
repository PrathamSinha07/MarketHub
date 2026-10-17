"use client";

import { useState, type FormEvent } from "react";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductGridSkeleton } from "@/components/products/ProductGridSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A to Z" },
  { value: "name_desc", label: "Name: Z to A" },
] as const;

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
  initialQuery,
}: {
  initialCategoryId?: number;
  initialQuery?: string;
}) {
  const [categoryId, setCategoryId] = useState<number | undefined>(
    initialCategoryId
  );
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState(initialQuery ?? "");
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery ?? "");
  const [sortBy, setSortBy] = useState("newest");

  const { data: categories } = useCategories();
  const {
    page: productPage,
    loading,
    error,
    reload,
  } = useProducts({
    categoryId,
    search: submittedQuery || undefined,
    sortBy,
    page,
    size: PAGE_SIZE,
  });

  const selectedCategory = categories?.find(
    (category) => category.id === categoryId
  );

  const selectCategory = (id?: number) => {
    setCategoryId(id);
    setPage(0);
  };

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(0);
    setSubmittedQuery(query.trim());
  }

  const clearSearch = () => {
    setQuery("");
    setSubmittedQuery("");
    setPage(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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

        <div className="flex flex-col gap-2 sm:flex-row">
          <form
            role="search"
            onSubmit={handleSearchSubmit}
            className="w-full lg:w-72"
          >
            <label htmlFor="product-search" className="sr-only">
              Search products
            </label>
            <input
              id="product-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products or sellers…"
              autoComplete="off"
              className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400"
            />
          </form>

          <label htmlFor="product-sort" className="sr-only">
            Sort products
          </label>
          <select
            id="product-sort"
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value);
              setPage(0);
            }}
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <ProductGridSkeleton count={PAGE_SIZE} />}

      {error && !loading && (
        <ErrorState
          title="Products unavailable"
          message={error}
          onRetry={reload}
        />
      )}

      {!loading && !error && productPage && (
        productPage.content.length === 0 ? (
          submittedQuery ? (
            <EmptyState
              title="No matches found"
              message={`No products match "${submittedQuery}". Try a different search or browse the full catalog.`}
            >
              <button
                type="button"
                onClick={clearSearch}
                className="mt-5 inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Clear search
              </button>
            </EmptyState>
          ) : (
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
          )
        ) : (
          <>
            <p className="text-sm text-zinc-500">
              {productPage.totalElements}{" "}
              {productPage.totalElements === 1 ? "product" : "products"}
              {selectedCategory ? ` in ${selectedCategory.name}` : ""}
              {submittedQuery ? ` matching "${submittedQuery}"` : ""}
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
