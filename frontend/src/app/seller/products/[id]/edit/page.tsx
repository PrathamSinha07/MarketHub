import type { Metadata } from "next";
import { ProductEditForm } from "@/components/seller/ProductEditForm";

export const metadata: Metadata = {
  title: "Edit product",
  description: "Edit a product in your MarketHub store.",
};

export default async function EditProductPage(
  props: PageProps<"/seller/products/[id]/edit">
) {
  const { id } = await props.params;
  const parsedId = Number(id);
  const productId =
    Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null;

  return <ProductEditForm productId={productId} />;
}
