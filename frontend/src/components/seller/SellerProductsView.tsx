"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCategories } from "@/hooks/useCategories";
import { useSellerProducts } from "@/hooks/useSellerProducts";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { StockBadge } from "@/components/products/StockBadge";
import { ProductStatusBadge } from "@/components/seller/ProductStatusBadge";
import { errorMessage } from "@/lib/api-client";
import { formatPrice } from "@/lib/utils";
import { productService } from "@/services/productService";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";

const PAGE_SIZE = 20;

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <table className="min-w-full divide-y divide-zinc-200 text-sm">
        <thead>
          <tr className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <th scope="col" className="px-4 py-3">Product</th>
            <th scope="col" className="px-4 py-3">Category</th>
            <th scope="col" className="px-4 py-3">Price</th>
            <th scope="col" className="px-4 py-3">Stock</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {Array.from({ length: 6 }).map((_, index) => (
            <tr key={index}>
              <td className="px-4 py-3">
                <div className="h-4 w-40 animate-pulse rounded bg-zinc-100" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-24 animate-pulse rounded bg-zinc-100" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-16 animate-pulse rounded bg-zinc-100" />
              </td>
              <td className="px-4 py-3">
                <div className="h-5 w-20 animate-pulse rounded-full bg-zinc-100" />
              </td>
              <td className="px-4 py-3">
                <div className="h-5 w-16 animate-pulse rounded-full bg-zinc-100" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-12 animate-pulse rounded bg-zinc-100" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
      className="flex items-center justify-center gap-4 pt-6"
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

/** Flattens the root categories (with children) into an id → name map. */
function buildCategoryNameMap(roots: Category[]): Map<number, string> {
  const map = new Map<number, string>();
  const walk = (categories: Category[]) => {
    for (const category of categories) {
      map.set(category.id, category.name);
      if (category.subCategories && category.subCategories.length > 0) {
        walk(category.subCategories);
      }
    }
  };
  walk(roots);
  return map;
}

/**
 * Seller product-management area.
 *
 * The backend has no seller-scoped product listing endpoint, so this
 * table intentionally shows the public marketplace catalog (newest
 * active products, all sellers) with a clear notice — it does not
 * pretend to be a "my products" list. Creating products works and the
 * backend assigns ownership from the JWT.
 */
export function SellerProductsView() {
  const [page, setPage] = useState(0);
  const { data: categories } = useCategories();
  const {
    page: productPage,
    loading,
    error,
    reload,
  } = useProducts({ page, size: PAGE_SIZE });

  const categoryNameById = useMemo(
    () => buildCategoryNameMap(categories ?? []),
    [categories]
  );

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Products
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage what you sell on MarketHub.
          </p>
        </div>
        <Link
          href="/seller/products/new"
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Add product
        </Link>
      </header>

      <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
        <p className="font-medium text-zinc-800">
          Showing the public marketplace catalog
        </p>
        <p className="mt-1">
          The API does not expose a seller-scoped product listing yet, so this
          table lists the newest active products from the whole marketplace
          rather than only your own. Draft, out-of-stock and archived products
          are not available through the API. New products you create appear
          here (they are published as active immediately).
        </p>
      </div>

      {loading && <TableSkeleton />}

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
            title="No products yet"
            message="No active products are listed on the marketplace yet. Add your first product to get started."
            actionHref="/seller/products/new"
            actionLabel="Add product"
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
              <table className="min-w-full divide-y divide-zinc-200 text-sm">
                <thead>
                  <tr className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    <th scope="col" className="px-4 py-3">Product</th>
                    <th scope="col" className="px-4 py-3">Category</th>
                    <th scope="col" className="px-4 py-3">Price</th>
                    <th scope="col" className="px-4 py-3">Stock</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {productPage.content.map((product: Product) => (
                    <tr key={product.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-900">
                          {product.name}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-400">
                          /{product.slug}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {categoryNameById.get(product.categoryId) ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-4 py-3">
                        <StockBadge quantity={product.stockQuantity} />
                      </td>
                      <td className="px-4 py-3">
                        <ProductStatusBadge status={product.status} />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/products/${product.id}`}
                          className="font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="pt-4 text-sm text-zinc-500">
              {productPage.totalElements} active{" "}
              {productPage.totalElements === 1 ? "product" : "products"} in the
              marketplace
            </p>

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
