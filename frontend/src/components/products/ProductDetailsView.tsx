"use client";

import { useState } from "react";
import Link from "next/link";
import { useProduct } from "@/hooks/useProduct";
import { useCategory } from "@/hooks/useCategory";
import { StockBadge } from "@/components/products/StockBadge";
import { QuantitySelector } from "@/components/products/QuantitySelector";
import { AddToCartButton } from "@/components/products/AddToCartButton";
import { ProductMedia } from "@/components/products/ProductMedia";
import { ProductDetailsSkeleton } from "@/components/products/ProductDetailsSkeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import {
  formatDate,
  formatPrice,
  formatProductStatus,
  getStockStatus,
} from "@/lib/utils";

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
  // The public endpoint also returns DRAFT/ARCHIVED/OUT_OF_STOCK
  // products, but only ACTIVE ones may be purchased (the server
  // enforces this too — this gate just explains it up front).
  const purchasable = product.status === "ACTIVE" && !outOfStock;

  return (
    <article aria-labelledby="product-name">
      <header>
        <h1
          id="product-name"
          className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl"
        >
          {product.name}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <StockBadge quantity={product.stockQuantity} />
          {product.status !== "ACTIVE" && (
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-500/20">
              {formatProductStatus(product.status)}
            </span>
          )}
        </div>
      </header>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <ProductMedia
            name={product.name}
            size="lg"
            className="aspect-[4/3] w-full rounded-lg border border-zinc-200"
          />

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
                <dd className="text-zinc-900">
                  {formatProductStatus(product.status)}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-6 lg:sticky lg:top-24">
          <p className="text-3xl font-semibold tracking-tight text-zinc-900">
            {formatPrice(product.price)}
          </p>
          <p className="mt-1.5 text-sm text-zinc-500">{stock.label}</p>

          {!purchasable && (
            <p
              role="status"
              className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800"
            >
              {product.status !== "ACTIVE"
                ? `This product isn't available for purchase right now — its status is ${formatProductStatus(product.status).toLowerCase()}.`
                : "This product is out of stock and can't be added to your cart."}
            </p>
          )}

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
                disabled={!purchasable}
              />
            </div>
          </div>

          <div className="mt-4">
            <AddToCartButton
              productId={product.id}
              quantity={quantity}
              disabled={!purchasable}
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
