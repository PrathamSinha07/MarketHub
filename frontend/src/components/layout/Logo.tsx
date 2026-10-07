import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span
        className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-sm font-bold text-white"
        aria-hidden="true"
      >
        M
      </span>
      <span className="text-lg font-semibold tracking-tight text-zinc-900">
        MarketHub
      </span>
    </Link>
  );
}
