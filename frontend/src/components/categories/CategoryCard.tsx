import Link from "next/link";
import type { Category } from "@/types/category";

/**
 * Category card. The title and arrow link to the category's catalog; the
 * subcategory chips (real data from the API) are links of their own so
 * shoppers can drill straight into a subcategory's products.
 */
export function CategoryCard({ category }: { category: Category }) {
  const subCategories = category.subCategories ?? [];
  const preview = subCategories.slice(0, 3);
  const extraCount = subCategories.length - preview.length;
  const categoryHref = `/products?categoryId=${category.id}`;

  return (
    <article className="group flex items-start justify-between gap-4 rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-indigo-300 hover:shadow-sm">
      <div className="min-w-0">
        <h3 className="text-base font-semibold">
          <Link
            href={categoryHref}
            className="text-zinc-900 transition-colors group-hover:text-indigo-600"
          >
            {category.name}
          </Link>
        </h3>

        {subCategories.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {preview.map((sub) => (
              <Link
                key={sub.id}
                href={`/products?categoryId=${sub.id}`}
                className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
              >
                {sub.name}
              </Link>
            ))}
            {extraCount > 0 && (
              <span className="rounded bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-400">
                +{extraCount} more
              </span>
            )}
          </div>
        ) : (
          <p className="mt-1.5 text-sm text-zinc-500">Shop this category</p>
        )}
      </div>

      <Link
        href={categoryHref}
        aria-hidden="true"
        tabIndex={-1}
        className="mt-1 shrink-0 text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:text-indigo-500"
      >
        →
      </Link>
    </article>
  );
}
