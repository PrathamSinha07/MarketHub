"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { errorMessage } from "@/lib/api-client";
import { cn, isApiError } from "@/lib/utils";
import { useCategories } from "@/hooks/useCategories";
import { FormField, inputClass, inputErrorClass } from "@/components/shared/FormField";
import { ErrorState } from "@/components/shared/ErrorState";
import type { FieldErrors } from "@/types/api";
import type { Category } from "@/types/category";
import type { ProductRequest } from "@/types/product";

/** URL-friendly slug derived from the product name until edited. */
export function slugify(value: string): string {
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

export interface ProductFormValues {
  name: string;
  slug: string;
  description: string;
  price: string;
  stockQuantity: string;
  categoryId: string;
}

const EMPTY_VALUES: ProductFormValues = {
  name: "",
  slug: "",
  description: "",
  price: "",
  stockQuantity: "",
  categoryId: "",
};

interface ProductFormProps {
  /** Current field values — pass the loaded product to prefill an edit form. */
  initialValues?: Partial<ProductFormValues>;
  submitLabel: string;
  submittingLabel: string;
  /** Performs the API call; must reject with `ApiError` on failure. */
  onSubmit: (request: ProductRequest) => Promise<void>;
  cancelHref?: string;
}

/**
 * Shared create/edit product form.
 *
 * Owns field state, client-side validation, server field-error mapping,
 * and double-submit prevention; the parent handles the API call and the
 * post-success flow. Seller identity is never part of the form — the
 * backend derives ownership from the JWT.
 */
export function ProductForm({
  initialValues,
  submitLabel,
  submittingLabel,
  onSubmit,
  cancelHref = "/seller/products",
}: ProductFormProps) {
  const { data: categories, loading: categoriesLoading, error: categoriesError, reload: reloadCategories } =
    useCategories();

  const [name, setName] = useState(initialValues?.name ?? EMPTY_VALUES.name);
  const [slug, setSlug] = useState(initialValues?.slug ?? EMPTY_VALUES.slug);
  // Once a slug exists (e.g. loaded for editing), stop deriving it from
  // the name so saving never silently rewrites the slug.
  const [slugEdited, setSlugEdited] = useState(Boolean(initialValues?.slug));
  const [description, setDescription] = useState(
    initialValues?.description ?? EMPTY_VALUES.description
  );
  const [price, setPrice] = useState(initialValues?.price ?? EMPTY_VALUES.price);
  const [stockQuantity, setStockQuantity] = useState(
    initialValues?.stockQuantity ?? EMPTY_VALUES.stockQuantity
  );
  const [categoryId, setCategoryId] = useState(
    initialValues?.categoryId ?? EMPTY_VALUES.categoryId
  );

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const categoryOptions = useMemo(() => categories ?? [], [categories]);

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
    // Guard against re-entry (e.g. Enter key) while a request is in flight.
    if (submitting) {
      return;
    }
    setServerError(null);
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      // Seller ownership is derived from the JWT on the backend —
      // no seller id is part of the request contract.
      await onSubmit({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        price: Number(price),
        stockQuantity: Number(stockQuantity),
        categoryId: Number(categoryId),
      });
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

  return (
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
            href={cancelHref}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? submittingLabel : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
