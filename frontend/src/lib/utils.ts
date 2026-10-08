import { ApiError } from "@/lib/api-client";
import type { Role } from "@/types/auth";

/** Combines conditional class names. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Formats a backend price (NUMERIC(10,2)) for display. */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export type StockTone = "in-stock" | "low-stock" | "out-of-stock";

export interface StockStatus {
  label: string;
  tone: StockTone;
}

/** Availability indicator derived from the product stock quantity. */
export function getStockStatus(stockQuantity: number): StockStatus {
  if (stockQuantity <= 0) {
    return { label: "Out of stock", tone: "out-of-stock" };
  }
  if (stockQuantity <= 5) {
    return { label: `Only ${stockQuantity} left in stock`, tone: "low-stock" };
  }
  return { label: "In stock", tone: "in-stock" };
}

/** Maps backend role constants to display labels. */
export function formatRole(role: Role): string {
  switch (role) {
    case "ROLE_ADMIN":
      return "Admin";
    case "ROLE_SELLER":
      return "Seller";
    case "ROLE_CUSTOMER":
      return "Customer";
    default:
      return role;
  }
}

/** Keeps post-login redirects on-site (relative paths only). */
export function safeRedirectPath(value: string | undefined): string {
  if (!value) {
    return "/";
  }
  // Reject protocol-relative ("//host") and backslash-smuggled
  // ("/\host") values — URL parsers treat "\" as "/" for special
  // schemes, so both would leave the site.
  if (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\")
  ) {
    return value;
  }
  return "/";
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Formats an ISO-8601 date from the backend as a short date. */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
