"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { cartService } from "@/services/cartService";
import { orderService } from "@/services/orderService";
import { errorMessage } from "@/lib/api-client";
import { cn, formatPrice } from "@/lib/utils";
import { card } from "@/lib/ui";
import { QuantitySelector } from "@/components/products/QuantitySelector";
import { ProductMedia } from "@/components/products/ProductMedia";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import type { CartItemResponse, CartResponse } from "@/types/cart";
import type { OrderResponse, OrderStatus } from "@/types/order";

/** UI cap for the cart stepper; the server validates real stock. */
const MAX_QUANTITY = 999;

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

function CartSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="h-6 w-32 animate-pulse rounded bg-zinc-200" />
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-4"
        >
          <div className="h-16 w-16 shrink-0 animate-pulse rounded-md bg-zinc-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-200" />
            <div className="h-4 w-1/4 animate-pulse rounded bg-zinc-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CartRow({
  item,
  pending,
  locked,
  error,
  onQuantityChange,
  onRemove,
}: {
  item: CartItemResponse;
  /** This row's own request is in flight. */
  pending: boolean;
  /** Any cart mutation is in flight (locks all controls). */
  locked: boolean;
  error?: string;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  const productHref = `/products/${item.productId}`;

  return (
    <li className={cn(card, "p-4")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <ProductMedia
          name={item.productName}
          size="sm"
          className="h-16 w-16 shrink-0 rounded-md border border-zinc-200"
        />

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-zinc-900">
            <Link href={productHref} className="hover:text-indigo-600">
              {item.productName}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            {formatPrice(item.unitPrice)} each
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <QuantitySelector
            quantity={item.quantity}
            max={MAX_QUANTITY}
            onChange={onQuantityChange}
            disabled={locked}
          />
          <p className="w-28 text-right text-sm font-semibold text-zinc-900">
            {formatPrice(item.subtotal)}
          </p>
          <button
            type="button"
            onClick={onRemove}
            disabled={locked}
            aria-label={`Remove ${item.productName} from cart`}
            className="rounded-md px-2 py-1.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </li>
  );
}

export function CartView() {
  const { user } = useAuth();
  const { cart, loading, error, restricted, refresh, applyCart } = useCart();
  const [busyItemId, setBusyItemId] = useState<number | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [checkoutState, setCheckoutState] = useState<
    "idle" | "placing" | "placed"
  >("idle");
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const busy = busyItemId !== null || checkoutState === "placing";

  async function updateQuantity(item: CartItemResponse, quantity: number) {
    if (busy || quantity === item.quantity) {
      return;
    }
    setBusyItemId(item.cartItemId);
    setRowErrors((prev) => ({ ...prev, [item.cartItemId]: "" }));
    try {
      const next: CartResponse = await cartService.updateCartItem(
        item.cartItemId,
        { quantity }
      );
      applyCart(next);
    } catch (err) {
      setRowErrors((prev) => ({
        ...prev,
        [item.cartItemId]: errorMessage(err),
      }));
      // Re-sync with the server so the displayed cart stays truthful.
      refresh();
    } finally {
      setBusyItemId(null);
    }
  }

  async function removeItem(item: CartItemResponse) {
    if (busy) {
      return;
    }
    setBusyItemId(item.cartItemId);
    try {
      const next = await cartService.removeCartItem(item.cartItemId);
      applyCart(next);
      setRowErrors((prev) => ({ ...prev, [item.cartItemId]: "" }));
    } catch (err) {
      setRowErrors((prev) => ({
        ...prev,
        [item.cartItemId]: errorMessage(err),
      }));
      refresh();
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleCheckout() {
    // Guard against duplicate submissions while a request is in flight.
    if (checkoutState !== "idle") {
      return;
    }
    setCheckoutState("placing");
    setCheckoutError(null);
    try {
      const placedOrder = await orderService.checkout();
      setOrder(placedOrder);
      setCheckoutState("placed");
      // The server empties the cart as part of checkout.
      refresh();
    } catch (err) {
      setCheckoutError(errorMessage(err));
      setCheckoutState("idle");
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Your cart
      </h1>

      {restricted ? (
        <section className={`${card} mt-6 p-8 text-center`}>
          <h2 className="text-base font-semibold text-zinc-900">
            This account doesn&apos;t include a shopping cart
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
            {user?.role === "ROLE_SELLER"
              ? "Seller accounts manage products and orders from the seller dashboard. Sign in with a customer account to shop."
              : "Sign in with a customer account to shop on the marketplace."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
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
        </section>
      ) : checkoutState === "placed" && order ? (
        <section
          aria-labelledby="order-confirmed-heading"
          className={`${card} mt-6 p-6 sm:p-8`}
        >
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
          <h2
            id="order-confirmed-heading"
            className="mt-4 text-lg font-semibold text-zinc-900"
          >
            Order placed
          </h2>
          <p className="mt-1.5 max-w-xl text-sm leading-6 text-zinc-600">
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

          <div className="mt-6">
            <Link
              href="/products"
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Continue shopping
            </Link>
          </div>
        </section>
      ) : loading ? (
        <div className="mt-6">
          <CartSkeleton />
        </div>
      ) : error ? (
        <div className="mt-6">
          <ErrorState
            title="Cart unavailable"
            message={error}
            onRetry={refresh}
          />
        </div>
      ) : !cart || cart.items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Your cart is empty"
            message="Browse the marketplace and add products to your cart. Your cart is synced to your account."
            actionHref="/products"
            actionLabel="Browse products"
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <ul className="space-y-4">
              {cart.items.map((item) => (
                <CartRow
                  key={item.cartItemId}
                  item={item}
                  pending={busyItemId === item.cartItemId}
                  locked={busy}
                  error={rowErrors[item.cartItemId]}
                  onQuantityChange={(quantity) =>
                    updateQuantity(item, quantity)
                  }
                  onRemove={() => removeItem(item)}
                />
              ))}
            </ul>

            <div className="mt-5">
              <Link
                href="/products"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                ← Continue shopping
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
              onClick={handleCheckout}
              disabled={busy}
              className="mt-5 w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkoutState === "placing"
                ? "Placing order…"
                : "Proceed to checkout"}
            </button>

            <p className="mt-3 text-xs leading-5 text-zinc-500">
              Checkout places an order for the items in your cart.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
