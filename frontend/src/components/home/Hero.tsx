import Link from "next/link";

export function Hero() {
  return (
    <section className="border-b border-zinc-200 bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Source quality products from independent sellers
          </h1>
          <p className="mt-4 text-base leading-7 text-zinc-600 sm:text-lg">
            MarketHub is a multi-vendor marketplace where verified sellers
            list their products. Compare offerings, check live stock, and
            place orders — all in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex items-center rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Browse products
            </Link>
            <Link
              href="/#categories"
              className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Explore categories
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
