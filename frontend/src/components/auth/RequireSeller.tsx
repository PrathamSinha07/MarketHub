"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { RequireAuth } from "./RequireAuth";

/**
 * Renders children only for authenticated sellers.
 *
 * Guests go through the existing `RequireAuth` login redirect (with a
 * `next` return URL). Other signed-in roles get a simple "Seller access
 * required" state. The role comes from the existing session — this is a
 * guard on top of the current auth system, not a new mechanism.
 */
export function RequireSeller({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <SellerRoleGate>{children}</SellerRoleGate>
    </RequireAuth>
  );
}

function SellerRoleGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (!user) {
    // RequireAuth is already redirecting guests to /login.
    return null;
  }

  if (user.role !== "ROLE_SELLER") {
    return <SellerAccessRequired />;
  }

  return <>{children}</>;
}

function SellerAccessRequired() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-6 w-6 text-zinc-400"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
      </div>
      <h1 className="mt-4 text-xl font-semibold text-zinc-900">
        Seller access required
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        The seller dashboard is only available to MarketHub seller accounts.
        Your current account does not have the seller role.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Back to marketplace
        </Link>
        <Link
          href="/products"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Browse products
        </Link>
      </div>
    </div>
  );
}
