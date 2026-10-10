import Link from "next/link";
import type { Product } from "@/types/product";
import { formatPrice } from "@/lib/utils";
import { StockBadge } from "./StockBadge";
import { ProductMedia } from "./ProductMedia";

export function ProductCard({ product }: { product: Product }) {
  const detailsHref = `/products/${product.id}`;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white transition-shadow hover:shadow-md">
      <ProductMedia
        name={product.name}
        className="aspect-[4/3] w-full border-b border-zinc-200"
      />

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-medium leading-snug text-zinc-900">
            <Link
              href={detailsHref}
              className="line-clamp-2 hover:text-indigo-600"
            >
              {product.name}
            </Link>
          </h3>
          <StockBadge quantity={product.stockQuantity} />
        </div>

        {product.sellerName && (
          <p className="mt-1.5 truncate text-xs text-zinc-500">
            Sold by{" "}
            <span className="font-medium text-zinc-600">
              {product.sellerName}
            </span>
          </p>
        )}

        <p className="mt-3 text-base font-semibold text-zinc-900">
          {formatPrice(product.price)}
        </p>

        <div className="mt-auto pt-4">
          <Link
            href={detailsHref}
            className="inline-flex w-full items-center justify-center rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
