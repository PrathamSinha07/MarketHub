import type { ReactNode } from "react";

interface ValueItem {
  title: string;
  description: string;
  icon: ReactNode;
}

/**
 * Honest "how it works" strip — every claim maps to behaviour the
 * marketplace actually implements (live stock, registered sellers,
 * in-app checkout). No statistics or ratings are invented.
 */
const VALUES: ValueItem[] = [
  {
    title: "Live availability",
    description:
      "Stock counts shown on every product come straight from each seller's listings.",
    icon: (
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
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: "Independent sellers",
    description:
      "Every listing belongs to a registered marketplace seller who manages their own products.",
    icon: (
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
          d="M13.5 21v-7.5h-3V21m-6 0v-7.5h3V21M3 3h18v3.75A2.25 2.25 0 0118.75 9H5.25A2.25 2.25 0 013 6.75V3zm15 0v3.75M6 6.75V3"
        />
      </svg>
    ),
  },
  {
    title: "Straightforward checkout",
    description:
      "Add items to your cart, review the total, and place your order in a single step.",
    icon: (
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
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
        />
      </svg>
    ),
  },
];

export function ValueSection() {
  return (
    <section aria-labelledby="value-heading" className="border-t border-zinc-200 pt-12 sm:pt-14">
      <div className="mx-auto max-w-2xl text-center">
        <h2
          id="value-heading"
          className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl"
        >
          How MarketHub works
        </h2>
        <p className="mt-1.5 text-sm text-zinc-500">
          A straightforward marketplace for buyers and sellers alike.
        </p>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {VALUES.map((value) => (
          <div key={value.title} className="rounded-lg border border-zinc-200 bg-white p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
              {value.icon}
            </span>
            <h3 className="mt-3 text-sm font-semibold text-zinc-900">
              {value.title}
            </h3>
            <p className="mt-1 text-sm leading-6 text-zinc-500">
              {value.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
