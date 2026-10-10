"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProduct } from "@/hooks/useProduct";
import { productService } from "@/services/productService";
import { ProductForm, type ProductFormValues } from "@/components/seller/ProductForm";
import { ProductStatusBadge } from "@/components/seller/ProductStatusBadge";
import { ErrorState } from "@/components/shared/ErrorState";
import type { Product, ProductRequest } from "@/types/product";

/** Mirrors the create-flow success panel, for the save action. */
function SavedPanel({ productName }: { productName: string }) {
  return (
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
        Changes saved
      </h2>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-emerald-800">
        “{productName}” has been updated.
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
  );
}

function EditFormSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index}>
            <div className="h-4 w-24 animate-pulse rounded bg-zinc-100" />
            <div className="mt-2 h-9 w-full animate-pulse rounded-md bg-zinc-100" />
          </div>
        ))}
        <div className="flex justify-end gap-3 pt-2">
          <div className="h-9 w-20 animate-pulse rounded-md bg-zinc-100" />
          <div className="h-9 w-28 animate-pulse rounded-md bg-zinc-100" />
        </div>
      </div>
    </div>
  );
}

function toFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    price: String(product.price),
    stockQuantity: String(product.stockQuantity),
    categoryId: String(product.categoryId),
  };
}

/**
 * Edit flow for a single seller product: loads the current values via
 * the public product endpoint, saves through `PUT /products/{id}`, and
 * returns to the refreshed list. Ownership and status transitions are
 * enforced by the backend (e.g. updating another seller's product by id
 * fails with 403; archived products stay archived).
 */
export function ProductEditForm({ productId }: { productId: number | null }) {
  const router = useRouter();
  const { product, loading, error, reload } = useProduct(productId);
  const [savedName, setSavedName] = useState<string | null>(null);

  // After a successful save, show the success state briefly and
  // then return to the seller products page.
  useEffect(() => {
    if (savedName === null) {
      return;
    }
    const timer = setTimeout(() => router.replace("/seller/products"), 1600);
    return () => clearTimeout(timer);
  }, [savedName, router]);

  async function handleSubmit(request: ProductRequest) {
    if (productId === null) {
      return;
    }
    await productService.updateProduct(productId, request);
    setSavedName(request.name);
  }

  if (productId === null) {
    return (
      <ErrorState
        title="Product not found"
        message="That product link is not valid. Go back to your products and pick one from the list."
      />
    );
  }

  if (savedName !== null) {
    return <SavedPanel productName={savedName} />;
  }

  if (loading) {
    return <EditFormSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        title="Product unavailable"
        message={error}
        onRetry={reload}
      />
    );
  }

  if (!product) {
    return null;
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
          / Edit
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Edit product
          </h1>
          <ProductStatusBadge status={product.status} />
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Update the details of “{product.name}”.
        </p>
        {product.status === "ARCHIVED" && (
          <p className="mt-2 rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
            This product is archived: it is hidden from the marketplace and
            cannot be added to carts. Editing its details here does not
            republish it.
          </p>
        )}
      </header>

      <ProductForm
        key={product.id}
        initialValues={toFormValues(product)}
        submitLabel="Save changes"
        submittingLabel="Saving…"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
