import Link from "next/link";
import { container } from "@/lib/ui";

export function Hero() {
  return (
    <section className="border-b border-zinc-200 bg-zinc-50">
      <div className={container}>
        <div className="max-w-2xl py-12 sm:py-14">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            Multi-vendor marketplace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Quality products from independent sellers
          </h1>
          <p className="mt-3 text-base leading-7 text-zinc-600">
            Browse listings from registered sellers, compare live stock, and
            place orders — all in one place.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex items-center rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Browse products
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
