import Link from "next/link";
import type { Category } from "@/types/category";

export function CategoryCard({ category }: { category: Category }) {
  const subCategories = category.subCategories ?? [];
  const preview = subCategories
    .slice(0, 3)
    .map((sub) => sub.name)
    .join(" · ");
  const extraCount = subCategories.length - 3;

  return (
    <Link
      href={`/products?categoryId=${category.id}`}
      className="group block rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-indigo-300 hover:shadow-sm"
    >
      <h3 className="text-base font-semibold text-zinc-900 group-hover:text-indigo-600">
        {category.name}
      </h3>
      <p className="mt-1.5 text-sm text-zinc-500">
        {preview
          ? `${preview}${extraCount > 0 ? ` +${extraCount} more` : ""}`
          : "Shop this category"}
      </p>
    </Link>
  );
}
