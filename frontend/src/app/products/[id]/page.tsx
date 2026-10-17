import { Suspense } from "react";
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

  // The breadcrumb lives in the view so the final crumb can show the
  // real product name once it has loaded.
  return <ProductDetailsView key={productId ?? "invalid"} productId={productId} />;
}
