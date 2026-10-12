"use client";

import { useMemo, useState } from "react";
import { useSellerOrderItems } from "@/hooks/useSellerOrderItems";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import type { SellerOrderItemResponse } from "@/types/order";

const ORDER_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  CONFIRMED: "bg-sky-50 text-sky-700 ring-sky-600/20",
  PROCESSING: "bg-sky-50 text-sky-700 ring-sky-600/20",
  SHIPPED: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  DELIVERED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  CANCELLED: "bg-red-50 text-red-700 ring-red-600/20",
};

function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        ORDER_STATUS_STYLES[status] ?? "bg-zinc-100 text-zinc-600 ring-zinc-500/20"
      )}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-4"
        >
          <div className="h-4 w-32 animate-pulse rounded bg-zinc-100" />
          <div className="h-4 w-12 animate-pulse rounded bg-zinc-100" />
          <div className="h-4 w-16 animate-pulse rounded bg-zinc-100" />
          <div className="ml-auto h-4 w-20 animate-pulse rounded bg-zinc-100" />
        </div>
      ))}
    </div>
  );
}

/**
 * Seller orders view — lists order items containing the seller's products.
 * Data is sourced from `GET /orders/seller` (scoped to the authenticated
 * seller via the JWT).
 */
export function SellerOrdersView() {
  const { data, loading, error, reload } = useSellerOrderItems();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredItems = useMemo(() => {
    const items = data ?? [];
    if (statusFilter === "ALL") return items;
    return items.filter((item) => item.orderStatus === statusFilter);
  }, [data, statusFilter]);

  const statusCounts = useMemo(() => {
    const items = data ?? [];
    const counts: Record<string, number> = { ALL: items.length };
    for (const item of items) {
      counts[item.orderStatus] = (counts[item.orderStatus] ?? 0) + 1;
    }
    return counts;
  }, [data]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort(
      (a, b) =>
        new Date(b.orderCreatedAt).getTime() -
        new Date(a.orderCreatedAt).getTime()
    );
  }, [filteredItems]);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Orders
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Orders containing your products, sorted by most recent.
        </p>
      </header>

      {statusCounts.ALL > 0 && (
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter by order status">
          {["ALL", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map(
            (status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                aria-pressed={statusFilter === status}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  statusFilter === status
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-zinc-300 bg-white text-zinc-600 hover:border-indigo-300 hover:text-indigo-600"
                )}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
                {statusCounts[status] !== undefined && (
                  <span className="ml-1.5 opacity-70">
                    {statusCounts[status]}
                  </span>
                )}
              </button>
            )
          )}
        </div>
      )}

      {loading && <SkeletonRows />}

      {error && !loading && (
        <ErrorState
          title="Orders unavailable"
          message={error}
          onRetry={reload}
        />
      )}

      {!loading && !error && data?.length === 0 && (
        <EmptyState
          title="No orders yet"
          message="When customers buy your products, their order items will appear here."
        />
      )}

      {!loading && !error && sortedItems.length > 0 && (
        <div className="space-y-3">
          {sortedItems.map((item: SellerOrderItemResponse) => (
            <div
              key={item.orderItemId}
              className="rounded-lg border border-zinc-200 bg-white p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900">
                    {item.productName}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Order #{item.orderId} ·{" "}
                    {formatDate(item.orderCreatedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-zinc-500">
                    Qty {item.quantity}
                  </span>
                  <span className="font-medium text-zinc-900">
                    {formatPrice(Number(item.subtotal))}
                  </span>
                  <OrderStatusBadge status={item.orderStatus} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
