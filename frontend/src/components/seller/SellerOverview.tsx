"use client";

import { useMemo } from "react";
import { useSellerOrderItems } from "@/hooks/useSellerOrderItems";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import type { SellerOrderItemResponse } from "@/types/order";

interface MetricCardProps {
  label: string;
  value: string;
  footnote: string;
  /** False when the backend has no endpoint to source this number. */
  available?: boolean;
}

function MetricCard({
  label,
  value,
  footnote,
  available = true,
}: MetricCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold tracking-tight",
          available ? "text-zinc-900" : "text-zinc-400"
        )}
      >
        {value}
      </p>
      <p className="mt-1.5 text-xs text-zinc-500">{footnote}</p>
    </div>
  );
}

function MetricCardSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="h-4 w-24 animate-pulse rounded bg-zinc-100" />
      <div className="mt-3 h-7 w-16 animate-pulse rounded bg-zinc-100" />
      <div className="mt-3 h-3 w-36 animate-pulse rounded bg-zinc-100" />
    </div>
  );
}

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

/**
 * Seller dashboard overview.
 *
 * All order numbers are derived from `GET /orders/seller` (real data).
 * Product metrics intentionally show an explicit not-available state:
 * the backend exposes no seller-scoped product listing, and the public
 * `GET /products` cannot attribute products to this seller.
 */
export function SellerOverview() {
  const { data, loading, error, reload } = useSellerOrderItems();

  const stats = useMemo(() => {
    const items = data ?? [];
    const orderIds = new Set(items.map((item) => item.orderId));
    const units = items.reduce((sum, item) => sum + item.quantity, 0);
    const revenue = items.reduce((sum, item) => sum + Number(item.subtotal), 0);
    const recent = [...items]
      .sort(
        (a, b) =>
          new Date(b.orderCreatedAt).getTime() -
          new Date(a.orderCreatedAt).getTime()
      )
      .slice(0, 5);
    return { itemCount: items.length, orderCount: orderIds.size, units, revenue, recent };
  }, [data]);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Overview
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          A snapshot of your seller account on MarketHub.
        </p>
      </header>

      {loading && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <MetricCardSkeleton key={index} />
            ))}
          </div>
          <div className="mt-8 overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <div className="px-4 py-3">
              <div className="h-5 w-32 animate-pulse rounded bg-zinc-100" />
            </div>
          </div>
        </>
      )}

      {error && !loading && (
        <ErrorState
          title="Dashboard data unavailable"
          message={error}
          onRetry={reload}
        />
      )}

      {!loading && !error && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              label="Seller orders"
              value={String(stats.orderCount)}
              footnote={
                stats.orderCount === 1
                  ? "Order containing your products"
                  : "Orders containing your products"
              }
            />
            <MetricCard
              label="Units sold"
              value={String(stats.units)}
              footnote="Across all seller order items"
            />
            <MetricCard
              label="Order revenue"
              value={formatPrice(stats.revenue)}
              footnote="Sum of your item subtotals"
            />
            <MetricCard
              label="Total products"
              value="—"
              footnote="Not available — no seller products endpoint"
              available={false}
            />
            <MetricCard
              label="Active products"
              value="—"
              footnote="Not available — no seller products endpoint"
              available={false}
            />
            <MetricCard
              label="Out-of-stock products"
              value="—"
              footnote="Not available — no seller products endpoint"
              available={false}
            />
          </div>

          <section aria-labelledby="recent-orders-heading" className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2
                id="recent-orders-heading"
                className="text-base font-semibold text-zinc-900"
              >
                Recent orders
              </h2>
              <p className="text-sm text-zinc-500">
                {stats.itemCount > 0
                  ? `Latest ${stats.recent.length} of ${stats.itemCount} order ${
                      stats.itemCount === 1 ? "item" : "items"
                    }`
                  : ""}
              </p>
            </div>

            {stats.itemCount === 0 ? (
              <EmptyState
                title="No orders yet"
                message="When customers buy your products, their order items will appear here."
              />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
                <table className="min-w-full divide-y divide-zinc-200 text-sm">
                  <thead>
                    <tr className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      <th scope="col" className="px-4 py-3">
                        Product
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Qty
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Subtotal
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Status
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {stats.recent.map(
                      (item: SellerOrderItemResponse) => (
                        <tr key={item.orderItemId}>
                          <td className="px-4 py-3 font-medium text-zinc-900">
                            {item.productName}
                          </td>
                          <td className="px-4 py-3 text-zinc-600">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-zinc-600">
                            {formatPrice(Number(item.subtotal))}
                          </td>
                          <td className="px-4 py-3">
                            <OrderStatusBadge status={item.orderStatus} />
                          </td>
                          <td className="px-4 py-3 text-zinc-500">
                            {formatDate(item.orderCreatedAt)}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
