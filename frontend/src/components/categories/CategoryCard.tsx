import Link from "next/link";
import type { Category } from "@/types/category";

/**
 * Category card. Subcategories (real data from the API) render as
 * chips so the tile communicates what the department contains.
 */
export function CategoryCard({ category }: { category: Category }) {
  const subCategories = category.subCategories ?? [];
  const preview = subCategories.slice(0, 3);
  const extraCount = subCategories.length - preview.length;

  return (
    <Link
      href={`/products?categoryId=${category.id}`}
      className="group flex items-start justify-between gap-4 rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-indigo-300 hover:shadow-sm"
    >
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-zinc-900 group-hover:text-indigo-600">
          {category.name}
        </h3>

        {subCategories.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {preview.map((sub) => (
              <span
                key={sub.id}
                className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600"
              >
                {sub.name}
              </span>
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

      <span
        aria-hidden="true"
        className="mt-1 shrink-0 text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:text-indigo-500"
      >
        →
      </span>
    </Link>
  );
}
