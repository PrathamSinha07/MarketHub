import Link from "next/link";
import { container } from "@/lib/ui";

export function SellCta() {
  return (
    <section aria-labelledby="sell-cta-heading" className="bg-indigo-600">
      <div className={container}>
        <div className="flex flex-col gap-6 py-12 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <h2
              id="sell-cta-heading"
              className="text-xl font-semibold text-white sm:text-2xl"
            >
              Sell on MarketHub
            </h2>
            <p className="mt-2 text-sm leading-6 text-indigo-100">
              Join the marketplace and reach buyers across the country. Set up
              your store, list products, and manage orders from a single seller
              dashboard.
            </p>
          </div>
          <Link
            href="/register"
            className="inline-flex shrink-0 items-center justify-center rounded-md bg-white px-5 py-2.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-50"
          >
            Create a seller account
          </Link>
        </div>
      </div>
    </section>
  );
}
