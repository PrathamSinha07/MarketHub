"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { orderService } from "@/services/orderService";
import { errorMessage } from "@/lib/api-client";
import { formatPrice } from "@/lib/utils";
import { card } from "@/lib/ui";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import type { OrderResponse, OrderStatus } from "@/types/order";

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

function CheckoutSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="h-6 w-32 animate-pulse rounded bg-zinc-200" />
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-lg border border-zinc-200 bg-white"
        />
      ))}
      <div className="ml-auto h-8 w-48 animate-pulse rounded-md bg-zinc-200" />
    </div>
  );
}

/**
 * Checkout view — shows the cart summary and places the order on
 * confirmation. The cart is emptied server-side on successful checkout.
 */
export function CheckoutView() {
  const { user } = useAuth();
  const { cart, loading, error, restricted, refresh } = useCart();
  const [placing, setPlacing] = useState(false);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const isCustomer = user?.role === "ROLE_CUSTOMER";

  async function handlePlaceOrder() {
    if (placing) return;
    setPlacing(true);
    setCheckoutError(null);
    try {
      const placedOrder = await orderService.checkout();
      setOrder(placedOrder);
      refresh();
    } catch (err) {
      setCheckoutError(errorMessage(err));
    } finally {
      setPlacing(false);
    }
  }

  if (restricted || !isCustomer) {
    return (
      <div className={`${card} mx-auto max-w-md p-8 text-center`}>
        <h2 className="text-base font-semibold text-zinc-900">
          Checkout is for customer accounts
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          {user?.role === "ROLE_SELLER"
            ? "Seller accounts manage products and orders from the seller dashboard."
            : "Sign in with a customer account to check out."}
        </p>
        <div className="mt-5 flex justify-center gap-3">
          {user?.role === "ROLE_SELLER" && (
            <Link
              href="/seller"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Go to seller dashboard
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

  if (order) {
    return (
      <div className={`${card} mx-auto max-w-lg p-6 sm:p-8`}>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </span>
        <h2 className="mt-4 text-lg font-semibold text-zinc-900">
          Order placed
        </h2>
        <p className="mt-1.5 text-sm leading-6 text-zinc-600">
          Your order has been created and sent to the sellers. This confirms
          the order only — it does not mean payment has been completed.
        </p>

        <dl className="mt-5 grid grid-cols-1 gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-zinc-500">Order number</dt>
            <dd className="mt-0.5 font-medium text-zinc-900">
              #{order.orderId}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Status</dt>
            <dd className="mt-0.5 font-medium text-zinc-900">
              {ORDER_STATUS_LABELS[order.status] ?? order.status}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Total</dt>
            <dd className="mt-0.5 font-medium text-zinc-900">
              {formatPrice(order.totalAmount)}
            </dd>
          </div>
        </dl>

        <ul className="mt-4 divide-y divide-zinc-200 border-t border-zinc-200 text-sm">
          {order.items.map((item) => (
            <li
              key={item.orderItemId}
              className="flex items-center justify-between gap-4 py-3"
            >
              <span className="min-w-0 truncate text-zinc-700">
                {item.productName}
                <span className="text-zinc-500"> × {item.quantity}</span>
              </span>
              <span className="shrink-0 font-medium text-zinc-900">
                {formatPrice(item.subtotal)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex gap-3">
          <Link
            href="/orders"
            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            View my orders
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Checkout
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Review your order before placing it.
      </p>

      {loading && (
        <div className="mt-6">
          <CheckoutSkeleton />
        </div>
      )}

      {error && !loading && (
        <div className="mt-6">
          <ErrorState
            title="Checkout unavailable"
            message={error}
            onRetry={refresh}
          />
        </div>
      )}

      {!loading && !error && (!cart || cart.items.length === 0) && (
        <div className="mt-6">
          <EmptyState
            title="Your cart is empty"
            message="Add products to your cart before checking out."
            actionHref="/products"
            actionLabel="Browse products"
          />
        </div>
      )}

      {!loading && !error && cart && cart.items.length > 0 && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <ul className="space-y-4">
              {cart.items.map((item) => (
                <li
                  key={item.cartItemId}
                  className={`${card} flex items-center gap-4 p-4`}
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-medium text-zinc-900">
                      {item.productName}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-500">
                      {formatPrice(item.unitPrice)} each
                    </p>
                  </div>
                  <span className="text-sm text-zinc-600">
                    × {item.quantity}
                  </span>
                  <span className="w-24 text-right text-sm font-semibold text-zinc-900">
                    {formatPrice(item.subtotal)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-5">
              <Link
                href="/cart"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                ← Back to cart
              </Link>
            </div>
          </div>

          <aside className={`${card} h-fit p-5 lg:sticky lg:top-24`}>
            <h2 className="text-base font-semibold text-zinc-900">
              Order summary
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500">
                  Subtotal (
                  {cart.items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                  {cart.items.reduce((sum, item) => sum + item.quantity, 0) ===
                  1
                    ? "item"
                    : "items"}
                  )
                </dt>
                <dd className="font-medium text-zinc-900">
                  {formatPrice(cart.subtotal)}
                </dd>
              </div>
            </dl>

            {checkoutError && (
              <p role="alert" className="mt-4 text-sm text-red-600">
                {checkoutError}
              </p>
            )}

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={placing}
              className="mt-5 w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {placing ? "Placing order…" : "Place order"}
            </button>

            <p className="mt-3 text-xs leading-5 text-zinc-500">
              Placing an order creates it with status{" "}
              <span className="font-medium">CONFIRMED</span> and reserves your
              stock. No payment is collected on this page.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
