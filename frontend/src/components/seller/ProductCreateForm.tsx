"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { productService } from "@/services/productService";
import { ProductForm } from "@/components/seller/ProductForm";
import type { ProductRequest } from "@/types/product";

/**
 * Seller product-creation flow: shared `ProductForm` plus the
 * post-create success panel and redirect back to the product list.
 */
export function ProductCreateForm() {
  const router = useRouter();
  const [createdName, setCreatedName] = useState<string | null>(null);

  // After a successful creation, show the success state briefly and
  // then return to the seller products page.
  useEffect(() => {
    if (createdName === null) {
      return;
    }
    const timer = setTimeout(() => router.replace("/seller/products"), 1600);
    return () => clearTimeout(timer);
  }, [createdName, router]);

  async function handleSubmit(request: ProductRequest) {
    // Seller ownership is derived from the JWT on the backend —
    // no seller id is part of the request contract.
    await productService.createProduct(request);
    setCreatedName(request.name);
  }

  if (createdName !== null) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-6 py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6 text-emerald-600"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-semibold text-emerald-900">
            Product created
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-emerald-800">
            “{createdName}” is now live on the marketplace.
          </p>
          <div className="mt-6">
            <Link
              href="/seller/products"
              className="inline-flex rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Back to products
            </Link>
          </div>
          <p className="mt-3 text-xs text-emerald-700">
            Redirecting to your products…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6">
        <p className="text-sm text-zinc-500">
          <Link
            href="/seller/products"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Products
          </Link>{" "}
          / New
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
          New product
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Add a product to your store. It is published as active immediately.
        </p>
      </header>

      <ProductForm
        submitLabel="Create product"
        submittingLabel="Creating…"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
