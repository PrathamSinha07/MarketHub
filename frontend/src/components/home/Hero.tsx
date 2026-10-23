"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { container } from "@/lib/ui";

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-5 w-5 text-zinc-400"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  );
}

/**
 * Homepage hero — the marketplace value proposition plus a working
 * search that hands the query to the catalog's server-side search.
 */
export function Hero() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim();
    router.push(term ? `/products?q=${encodeURIComponent(term)}` : "/products");
  }

  return (
    <section className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-b from-indigo-50/80 via-white to-white">
      {/* Restrained decorative wash — keeps the hero feeling designed
          without implying imagery we don't have. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-indigo-100/60 blur-3xl"
      />
      <div className={`${container} relative`}>
        <div className="mx-auto max-w-2xl py-16 text-center sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Multi-vendor marketplace
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Quality products from independent sellers
          </h1>
          <p className="mt-4 text-base leading-7 text-zinc-600">
            Browse listings from registered sellers, compare live stock, and
            place orders — all in one place.
          </p>

          <form
            role="search"
            onSubmit={handleSearch}
            className="mx-auto mt-7 flex max-w-lg gap-2"
          >
            <label htmlFor="hero-search" className="sr-only">
              Search products
            </label>
            <div className="relative min-w-0 flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <SearchIcon />
              </span>
              <input
                id="hero-search"
                type="search"
                name="q"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products or sellers…"
                autoComplete="off"
                className="h-11 w-full rounded-md border border-zinc-300 bg-white pl-10 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400"
              />
            </div>
            <button
              type="submit"
              className="h-11 shrink-0 rounded-md bg-indigo-600 px-5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Search
            </button>
          </form>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/products"
              className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Browse all products
            </Link>
            <Link
              href="/#categories"
              className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Explore categories
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
