import Link from "next/link";
import { Logo } from "./Logo";
import { FooterCopyright } from "./FooterCopyright";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-500">
              MarketHub is a multi-vendor marketplace connecting buyers with
              independent sellers. Browse the catalog, compare sellers, and
              place orders in one place.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Marketplace</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-500">
              <li>
                <Link href="/products" className="hover:text-zinc-900">
                  All products
                </Link>
              </li>
              <li>
                <Link href="/#categories" className="hover:text-zinc-900">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-zinc-900">
                  Cart
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Account</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-500">
              <li>
                <Link href="/login" className="hover:text-zinc-900">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-zinc-900">
                  Create account
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-zinc-900">
                  Sell on MarketHub
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-zinc-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <FooterCopyright />
          <p className="text-xs text-zinc-400">
            Next.js frontend · Spring Boot backend
          </p>
        </div>
      </div>
    </footer>
  );
}
