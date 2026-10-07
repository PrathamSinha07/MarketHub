"use client";

import { useState } from "react";
import Link from "next/link";
import { useProduct } from "@/hooks/useProduct";
import { useCategory } from "@/hooks/useCategory";
import { StockBadge } from "@/components/products/StockBadge";
import { QuantitySelector } from "@/components/products/QuantitySelector";
import { AddToCartButton } from "@/components/products/AddToCartButton";
import { ProductDetailsSkeleton } from "@/components/products/ProductDetailsSkeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { formatDate, formatPrice, getStockStatus } from "@/lib/utils";

export function ProductDetailsView({
  productId,
}: {
  productId: number | null;
}) {
  const { product, loading, error, reload } = useProduct(productId);
  const { category } = useCategory(product?.categoryId);
  const [quantity, setQuantity] = useState(1);

  if (loading) {
    return <ProductDetailsSkeleton />;
  }

  if (error) {
    return <ErrorState title="Product unavailable" message={error} onRetry={reload} />;
  }

  if (!product) {
    return (
      <ErrorState
        title="Product not found"
        message="The product you are looking for does not exist or is no longer available."
        onRetry={reload}
      />
    );
  }

  const outOfStock = product.stockQuantity <= 0;
  const stock = getStockStatus(product.stockQuantity);

  return (
    <article aria-labelledby="product-name">
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <h1
            id="product-name"
            className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl"
          >
            {product.name}
          </h1>

          <div className="mt-3">
            <StockBadge quantity={product.stockQuantity} />
          </div>

          <section className="mt-8" aria-labelledby="description-heading">
            <h2
              id="description-heading"
              className="text-base font-semibold text-zinc-900"
            >
              Description
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-zinc-600">
              {product.description ||
                "The seller has not provided a description for this product."}
            </p>
          </section>

          <section className="mt-8" aria-labelledby="details-heading">
            <h2
              id="details-heading"
              className="text-base font-semibold text-zinc-900"
            >
              Product information
            </h2>
            <dl className="mt-3 divide-y divide-zinc-200 border-t border-zinc-200 text-sm">
              <div className="flex py-3">
                <dt className="w-36 shrink-0 text-zinc-500">Seller</dt>
                <dd className="text-zinc-900">
                  {product.sellerName ?? "Not listed"}
                </dd>
              </div>
              <div className="flex py-3">
                <dt className="w-36 shrink-0 text-zinc-500">Category</dt>
                <dd>
                  {category ? (
                    <Link
                      href={`/products?categoryId=${category.id}`}
                      className="text-indigo-600 hover:underline"
                    >
                      {category.name}
                    </Link>
                  ) : (
                    <span className="text-zinc-900">
                      Category {product.categoryId}
                    </span>
                  )}
                </dd>
              </div>
              <div className="flex py-3">
                <dt className="w-36 shrink-0 text-zinc-500">Listed on</dt>
                <dd className="text-zinc-900">
                  {formatDate(product.createdAt)}
                </dd>
              </div>
              <div className="flex py-3">
                <dt className="w-36 shrink-0 text-zinc-500">Status</dt>
                <dd className="text-zinc-900">{product.status}</dd>
              </div>
            </dl>
          </section>
        </div>

        <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-6 lg:sticky lg:top-24">
          <p className="text-2xl font-semibold tracking-tight text-zinc-900">
            {formatPrice(product.price)}
          </p>
          <p className="mt-1.5 text-sm text-zinc-500">{stock.label}</p>

          <div className="mt-6">
            <label
              htmlFor="quantity"
              className="text-sm font-medium text-zinc-700"
            >
              Quantity
            </label>
            <div className="mt-1.5">
              <QuantitySelector
                quantity={quantity}
                max={Math.max(product.stockQuantity, 1)}
                onChange={setQuantity}
                disabled={outOfStock}
              />
            </div>
          </div>

          <div className="mt-4">
            <AddToCartButton
              productId={product.id}
              quantity={quantity}
              disabled={outOfStock}
            />
          </div>

          <p className="mt-5 border-t border-zinc-200 pt-4 text-sm text-zinc-500">
            Sold by{" "}
            <span className="font-medium text-zinc-700">
              {product.sellerName ?? "MarketHub seller"}
            </span>
          </p>
        </aside>
      </div>
    </article>
  );
}
