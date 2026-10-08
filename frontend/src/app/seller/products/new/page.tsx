import type { Metadata } from "next";
import { ProductCreateForm } from "@/components/seller/ProductCreateForm";

export const metadata: Metadata = {
  title: "New product",
  description: "Add a new product to your MarketHub store.",
};

export default function NewProductPage() {
  return <ProductCreateForm />;
}
