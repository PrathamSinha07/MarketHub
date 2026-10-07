import { cn, getStockStatus, type StockTone } from "@/lib/utils";

const TONE_STYLES: Record<StockTone, string> = {
  "in-stock": "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "low-stock": "bg-amber-50 text-amber-700 ring-amber-600/20",
  "out-of-stock": "bg-red-50 text-red-700 ring-red-600/20",
};

const DOT_STYLES: Record<StockTone, string> = {
  "in-stock": "bg-emerald-500",
  "low-stock": "bg-amber-500",
  "out-of-stock": "bg-red-500",
};

/** Availability indicator for a product stock quantity. */
export function StockBadge({ quantity }: { quantity: number }) {
  const status = getStockStatus(quantity);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONE_STYLES[status.tone]
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", DOT_STYLES[status.tone])}
        aria-hidden="true"
      />
      {status.label}
    </span>
  );
}
