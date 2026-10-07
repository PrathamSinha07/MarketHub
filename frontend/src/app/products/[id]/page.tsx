import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ProductDetailsView } from "@/components/products/ProductDetailsView";
import { ProductDetailsSkeleton } from "@/components/products/ProductDetailsSkeleton";

export const metadata: Metadata = {
  title: "Product details",
  description: "Product details on the MarketHub marketplace.",
};

export default function ProductDetailsPage(
  props: PageProps<"/products/[id]">
) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<ProductDetailsSkeleton />}>
        <ProductDetailsContent {...props} />
      </Suspense>
    </div>
  );
}

async function ProductDetailsContent(props: PageProps<"/products/[id]">) {
  const { id } = await props.params;
  const parsedId = Number(id);
  const productId =
    Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null;

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-zinc-500">
          <li>
            <Link href="/" className="hover:text-zinc-900">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/products" className="hover:text-zinc-900">
              Products
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-zinc-900" aria-current="page">
            Product details
          </li>
        </ol>
      </nav>

      <ProductDetailsView key={productId ?? "invalid"} productId={productId} />
    </>
  );
}
