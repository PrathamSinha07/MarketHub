"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { orderService } from "@/services/orderService";
import { paymentService } from "@/services/paymentService";
import { errorMessage } from "@/lib/api-client";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import type { OrderResponse, OrderStatus } from "@/types/order";
import type { PaymentStatus } from "@/types/payment";

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  CONFIRMED: "bg-sky-50 text-sky-700 ring-sky-600/20",
  PROCESSING: "bg-sky-50 text-sky-700 ring-sky-600/20",
  SHIPPED: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  DELIVERED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  CANCELLED: "bg-red-50 text-red-700 ring-red-600/20",
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Payment pending",
  AUTHORIZED: "Payment authorized",
  CAPTURED: "Paid",
  FAILED: "Payment failed",
  CANCELLED: "Payment cancelled",
  REFUNDED: "Refunded",
};

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  AUTHORIZED: "bg-sky-50 text-sky-700 ring-sky-600/20",
  CAPTURED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  FAILED: "bg-red-50 text-red-700 ring-red-600/20",
  CANCELLED: "bg-red-50 text-red-700 ring-red-600/20",
  REFUNDED: "bg-zinc-100 text-zinc-600 ring-zinc-500/20",
};

function StatusBadge({
  status,
  label,
  styles,
}: {
  status: string;
  label: string;
  styles: Record<string, string>;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        styles[status] ?? "bg-zinc-100 text-zinc-600 ring-zinc-500/20"
      )}
    >
      {label}
    </span>
  );
}

function OrderCard({
  order,
  paymentStatus,
}: {
  order: OrderResponse;
  paymentStatus?: PaymentStatus;
}) {
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
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <StatusBadge
            status={order.status}
            label={
              order.status.charAt(0) + order.status.slice(1).toLowerCase()
            }
            styles={ORDER_STATUS_STYLES}
          />
          {paymentStatus ? (
            <StatusBadge
              status={paymentStatus}
              label={PAYMENT_STATUS_LABELS[paymentStatus]}
              styles={PAYMENT_STATUS_STYLES}
            />
          ) : (
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-500/20">
              No payment initiated
            </span>
          )}
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
 * Customer order history view. Loads the signed-in customer's orders from
 * `GET /orders` and their payments from `GET /payments`, so every order
 * states its payment truthfully (payments stay pending until a payment
 * provider is connected — see DEPLOYMENT.md).
 */
export function CustomerOrdersView() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [paymentsByOrder, setPaymentsByOrder] = useState<
    Map<number, PaymentStatus>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Bumping `attempt` re-runs the guarded effect below (retry path), so a
  // retry can never set state after the view unmounts.
  const [attempt, setAttempt] = useState(0);

  const isCustomer = user?.role === "ROLE_CUSTOMER";

  useEffect(() => {
    if (!isCustomer) return;

    let active = true;

    async function load() {
      try {
        const orderData = await orderService.getCustomerOrders();
        if (!active) return;
        setOrders(orderData);
        setError(null);

        // Payments are supplementary: if this call fails, the orders still
        // render and the payment badges fall back to "No payment initiated".
        try {
          const paymentData = await paymentService.getPayments();
          if (!active) return;
          setPaymentsByOrder(
            new Map(
              paymentData.map((payment) => [payment.orderId, payment.status])
            )
          );
        } catch {
          // Handled above - orders remain usable without payment badges.
        }
      } catch (err) {
        if (active) {
          setError(errorMessage(err));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [isCustomer, attempt]);

  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [orders]
  );

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
            setAttempt((value) => value + 1);
          }}
        />
      )}

      {!loading && !error && sortedOrders.length === 0 && (
        <EmptyState
          title="No orders yet"
          message="When you place an order, it will appear here."
          actionHref="/products"
          actionLabel="Browse products"
        />
      )}

      {!loading && !error && sortedOrders.length > 0 && (
        <>
          <ul className="space-y-3">
            {sortedOrders.map((order) => (
              <OrderCard
                key={order.orderId}
                order={order}
                paymentStatus={paymentsByOrder.get(order.orderId)}
              />
            ))}
          </ul>
          <p className="mt-4 text-xs leading-5 text-zinc-500">
            Payment processing is not live on MarketHub yet — orders are
            confirmed without collecting money, and payments stay pending
            until a payment provider is connected.
          </p>
        </>
      )}
    </div>
  );
}
