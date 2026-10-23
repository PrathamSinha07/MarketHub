import Link from "next/link";
import type { Product } from "@/types/product";
import { formatPrice } from "@/lib/utils";
import { StockBadge } from "./StockBadge";
import { ProductMedia } from "./ProductMedia";

/**
 * Catalog product card.
 *
 * Hierarchy: image → category eyebrow → name (two lines, reserved) →
 * seller → price + availability → aligned "View details" action. The
 * name block and seller line reserve their heights, so prices and the
 * action stay aligned across a grid row regardless of name length.
 */
export function ProductCard({ product }: { product: Product }) {
  const detailsHref = `/products/${product.id}`;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2">
      <ProductMedia
        name={product.name}
        imageUrl={product.imageUrl}
        categoryName={product.categoryName}
        className="aspect-[4/3] w-full border-b border-zinc-200"
      />

      <div className="flex flex-1 flex-col p-4">
        {product.categoryName && (
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            {product.categoryName}
          </p>
        )}

        <h3
          className={
            product.categoryName
              ? "mt-1 min-h-10 min-w-0 text-sm font-semibold leading-snug text-zinc-900"
              : "min-h-10 min-w-0 text-sm font-semibold leading-snug text-zinc-900"
          }
        >
          <Link
            href={detailsHref}
            className="line-clamp-2 transition-colors hover:text-indigo-600"
          >
            {product.name}
          </Link>
        </h3>

        <p className="mt-1 min-h-4 truncate text-xs text-zinc-500">
          {product.sellerName && (
            <>
              Sold by{" "}
              <span className="font-medium text-zinc-600">
                {product.sellerName}
              </span>
            </>
          )}
        </p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-lg font-semibold tracking-tight text-zinc-900">
            {formatPrice(product.price)}
          </p>
          <StockBadge quantity={product.stockQuantity} />
        </div>

        <div className="mt-auto pt-4">
          <Link
            href={detailsHref}
            aria-label={`View details for ${product.name}`}
            className="inline-flex w-full items-center justify-center rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors group-hover:border-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
