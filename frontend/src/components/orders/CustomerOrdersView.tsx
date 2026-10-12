"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { orderService } from "@/services/orderService";
import { errorMessage } from "@/lib/api-client";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import type { OrderResponse, OrderStatus } from "@/types/order";

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  CONFIRMED: "bg-sky-50 text-sky-700 ring-sky-600/20",
  PROCESSING: "bg-sky-50 text-sky-700 ring-sky-600/20",
  SHIPPED: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  DELIVERED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  CANCELLED: "bg-red-50 text-red-700 ring-red-600/20",
};

function OrderStatusBadge({ status }: { status: OrderStatus }) {
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

function OrderCard({ order }: { order: OrderResponse }) {
  return (
    <li className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-900">
            Order #{order.orderId}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {formatDate(order.createdAt)} ·{" "}
            {order.items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
            {order.items.reduce((sum, item) => sum + item.quantity, 0) === 1
              ? "item"
              : "items"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          <span className="text-sm font-semibold text-zinc-900">
            {formatPrice(order.totalAmount)}
          </span>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5 border-t border-zinc-100 pt-3">
        {order.items.map((item) => (
          <li
            key={item.orderItemId}
            className="flex items-center justify-between text-sm"
          >
            <span className="min-w-0 truncate text-zinc-600">
              {item.productName}
              <span className="text-zinc-400"> × {item.quantity}</span>
            </span>
            <span className="shrink-0 text-zinc-500">
              {formatPrice(item.subtotal)}
            </span>
          </li>
        ))}
      </ul>
    </li>
  );
}

function OrdersSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-24 animate-pulse rounded-lg border border-zinc-200 bg-white"
        />
      ))}
    </div>
  );
}

/**
 * Customer order history view. Loads the signed-in customer's orders
 * from `GET /orders` and displays them as a list.
 */
export function CustomerOrdersView() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isCustomer = user?.role === "ROLE_CUSTOMER";

  useEffect(() => {
    if (!isCustomer) return;

    let active = true;

    orderService
      .getCustomerOrders()
      .then((data) => {
        if (active) {
          setOrders(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(errorMessage(err));
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isCustomer]);

  if (!isCustomer) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h2 className="text-lg font-semibold text-zinc-900">
          Orders are for customer accounts
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          {user?.role === "ROLE_SELLER"
            ? "Seller accounts manage orders from the seller dashboard."
            : "Sign in with a customer account to view your orders."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          {user?.role === "ROLE_SELLER" && (
            <Link
              href="/seller/orders"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Go to seller orders
            </Link>
          )}
          <Link
            href="/products"
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          My orders
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Your order history on MarketHub.
        </p>
      </header>

      {loading && <OrdersSkeleton />}

      {error && !loading && (
        <ErrorState
          title="Orders unavailable"
          message={error}
          onRetry={() => {
            setLoading(true);
            setError(null);
            orderService
              .getCustomerOrders()
              .then(setOrders)
              .catch((err: unknown) =>
                setError(errorMessage(err))
              )
              .finally(() => setLoading(false));
          }}
        />
      )}

      {!loading && !error && orders.length === 0 && (
        <EmptyState
          title="No orders yet"
          message="When you place an order, it will appear here."
          actionHref="/products"
          actionLabel="Browse products"
        />
      )}

      {!loading && !error && orders.length > 0 && (
        <ul className="space-y-3">
          {orders.map((order) => (
            <OrderCard key={order.orderId} order={order} />
          ))}
        </ul>
      )}
    </div>
  );
}
