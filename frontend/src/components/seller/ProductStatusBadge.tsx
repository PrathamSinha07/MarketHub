import { cn } from "@/lib/utils";
import type { ProductStatus } from "@/types/product";

const STATUS_STYLES: Record<ProductStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  DRAFT: "bg-zinc-100 text-zinc-600 ring-zinc-500/20",
  OUT_OF_STOCK: "bg-red-50 text-red-700 ring-red-600/20",
  ARCHIVED: "bg-zinc-100 text-zinc-500 ring-zinc-400/30",
};

const STATUS_LABELS: Record<ProductStatus, string> = {
  ACTIVE: "Active",
  DRAFT: "Draft",
  OUT_OF_STOCK: "Out of stock",
  ARCHIVED: "Archived",
};

const DOT_STYLES: Record<ProductStatus, string> = {
  ACTIVE: "bg-emerald-500",
  DRAFT: "bg-zinc-400",
  OUT_OF_STOCK: "bg-red-500",
  ARCHIVED: "bg-zinc-300",
};

/** Lifecycle status indicator for a product. Matches the StockBadge style. */
export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        STATUS_STYLES[status] ?? "bg-zinc-100 text-zinc-600 ring-zinc-500/20"
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", DOT_STYLES[status] ?? "bg-zinc-400")}
        aria-hidden="true"
      />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
