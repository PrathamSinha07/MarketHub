"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { errorMessage } from "@/lib/api-client";
import { cn, isApiError } from "@/lib/utils";
import { productService } from "@/services/productService";
import { useCategories } from "@/hooks/useCategories";
import { FormField, inputClass, inputErrorClass } from "@/components/shared/FormField";
import { ErrorState } from "@/components/shared/ErrorState";
import type { FieldErrors } from "@/types/api";
import type { Category } from "@/types/category";

/** URL-friendly slug derived from the product name until edited. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Category `<select>` options: leaf categories under an optgroup for
 * parents that have subcategories, top-level categories with no
 * children as plain options.
 */
function CategoryOptions({ roots }: { roots: Category[] }) {
  return (
    <>
      <option value="" disabled>
        Select a category
      </option>
      {roots.map((root) =>
        root.subCategories && root.subCategories.length > 0 ? (
          <optgroup key={root.id} label={root.name}>
            {root.subCategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </optgroup>
        ) : (
          <option key={root.id} value={root.id}>
            {root.name}
          </option>
        )
      )}
    </>
  );
}

export function ProductCreateForm() {
  const router = useRouter();
  const { data: categories, loading: categoriesLoading, error: categoriesError, reload: reloadCategories } =
    useCategories();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(false);

  const categoryOptions = useMemo(() => categories ?? [], [categories]);

  // After a successful creation, show the success state briefly and
  // then return to the seller products page.
  useEffect(() => {
    if (!created) {
      return;
    }
    const timer = setTimeout(() => router.replace("/seller/products"), 1600);
    return () => clearTimeout(timer);
  }, [created, router]);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) {
      setSlug(slugify(value));
    }
  }

  function validate(): boolean {
    const errors: FieldErrors = {};

    if (!name.trim()) {
      errors.name = "Name is required";
    }

    if (!slug.trim()) {
      errors.slug = "Slug is required";
    } else if (!SLUG_PATTERN.test(slug.trim())) {
      errors.slug =
        "Slug can only contain lowercase letters, numbers and hyphens";
    }

    if (!price.trim()) {
      errors.price = "Price is required";
    } else if (!(Number(price) > 0)) {
      errors.price = "Price must be greater than 0";
    }

    if (!stockQuantity.trim()) {
      errors.stockQuantity = "Stock quantity is required";
    } else if (!/^\d+$/.test(stockQuantity.trim())) {
      errors.stockQuantity = "Stock quantity must be a whole number of 0 or more";
    }

    if (!categoryId) {
      errors.categoryId = "Category is required";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      // Seller ownership is derived from the JWT on the backend —
      // no seller id is part of the request contract.
      await productService.createProduct({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        price: Number(price),
        stockQuantity: Number(stockQuantity),
        categoryId: Number(categoryId),
      });
      setCreated(true);
    } catch (error) {
      if (isApiError(error)) {
        setServerError(error.message);
        if (error.fieldErrors) {
          setFieldErrors(error.fieldErrors);
        }
      } else {
        setServerError(errorMessage(error));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
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
            “{name.trim()}” is now live on the marketplace.
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

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        {serverError && (
          <p
            className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {serverError}
          </p>
        )}

        {categoriesError && (
          <ErrorState
            title="Categories unavailable"
            message={categoriesError}
            onRetry={reloadCategories}
          />
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormField label="Name" htmlFor="product-name" error={fieldErrors.name}>
            <input
              id="product-name"
              name="name"
              type="text"
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              placeholder="e.g. Wireless headphones"
              className={cn(inputClass, fieldErrors.name && inputErrorClass)}
            />
          </FormField>

          <FormField
            label="Slug"
            htmlFor="product-slug"
            error={fieldErrors.slug}
            hint="URL identifier, e.g. wireless-headphones. Generated from the name until you edit it."
          >
            <input
              id="product-slug"
              name="slug"
              type="text"
              value={slug}
              onChange={(event) => {
                setSlugEdited(true);
                setSlug(event.target.value);
              }}
              placeholder="wireless-headphones"
              className={cn(inputClass, fieldErrors.slug && inputErrorClass)}
            />
          </FormField>

          <FormField
            label="Description"
            htmlFor="product-description"
            hint="Optional — shown on the product page."
          >
            <textarea
              id="product-description"
              name="description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What makes this product great?"
              className={cn(inputClass, "resize-y")}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Price (₹)"
              htmlFor="product-price"
              error={fieldErrors.price}
            >
              <input
                id="product-price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="999.00"
                className={cn(inputClass, fieldErrors.price && inputErrorClass)}
              />
            </FormField>

            <FormField
              label="Stock quantity"
              htmlFor="product-stock"
              error={fieldErrors.stockQuantity}
            >
              <input
                id="product-stock"
                name="stockQuantity"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={stockQuantity}
                onChange={(event) => setStockQuantity(event.target.value)}
                placeholder="25"
                className={cn(
                  inputClass,
                  fieldErrors.stockQuantity && inputErrorClass
                )}
              />
            </FormField>
          </div>

          <FormField
            label="Category"
            htmlFor="product-category"
            error={fieldErrors.categoryId}
          >
            <select
              id="product-category"
              name="categoryId"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              disabled={categoriesLoading}
              className={cn(
                inputClass,
                fieldErrors.categoryId && inputErrorClass,
                categoriesLoading && "cursor-not-allowed opacity-60"
              )}
            >
              {categoriesLoading ? (
                <option value="" disabled>
                  Loading categories…
                </option>
              ) : (
                <CategoryOptions roots={categoryOptions} />
              )}
            </select>
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/seller/products"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Create product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
