"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCategories } from "@/hooks/useCategories";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-zinc-100 text-zinc-900"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      )}
    >
      {label}
    </Link>
  );
}

function MobileLink({
  href,
  label,
  active,
  onClick,
}: {
  href: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "block rounded-md px-3 py-2.5 text-base font-medium",
        active
          ? "bg-zinc-100 text-zinc-900"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      )}
    >
      {label}
    </Link>
  );
}

function MenuIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 20 20"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { data: categories } = useCategories();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const isProductsActive =
    pathname === "/products" || pathname.startsWith("/products/");
  const rootCategories = categories ?? [];
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          <NavLink href="/" label="Home" active={pathname === "/"} />
          <NavLink href="/products" label="Products" active={isProductsActive} />

          <div className="relative">
            <button
              type="button"
              onClick={() => setCategoriesOpen((open) => !open)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setCategoriesOpen(false);
                }
              }}
              aria-expanded={categoriesOpen}
              aria-haspopup="true"
              className={cn(
                "flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isProductsActive
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              Categories
              <ChevronDownIcon
                className={cn(
                  "h-4 w-4 transition-transform",
                  categoriesOpen && "rotate-180"
                )}
              />
            </button>

            {categoriesOpen && (
              <div
                role="menu"
                className="absolute left-0 z-50 mt-1 w-56 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
              >
                <Link
                  href="/products"
                  role="menuitem"
                  onClick={() => setCategoriesOpen(false)}
                  className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  All products
                </Link>
                {rootCategories.length > 0 && (
                  <div className="my-1 border-t border-zinc-100" />
                )}
                {rootCategories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/products?categoryId=${category.id}`}
                    role="menuitem"
                    onClick={() => setCategoriesOpen(false)}
                    className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <NavLink href="/cart" label="Cart" active={pathname === "/cart"} />
        </nav>

        <div className="hidden items-center gap-1 md:flex">
          <Link
            href="/login"
            className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Create account
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
          className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 md:hidden"
        >
          {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {mobileMenuOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile"
          className="border-t border-zinc-200 bg-white md:hidden"
        >
          <div className="space-y-1 px-4 py-3">
            <MobileLink
              href="/"
              label="Home"
              active={pathname === "/"}
              onClick={closeMobileMenu}
            />
            <MobileLink
              href="/products"
              label="Products"
              active={isProductsActive}
              onClick={closeMobileMenu}
            />

            <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Categories
            </p>
            {rootCategories.length === 0 ? (
              <p className="px-3 py-1 text-sm text-zinc-500">
                No categories available
              </p>
            ) : (
              rootCategories.map((category) => (
                <MobileLink
                  key={category.id}
                  href={`/products?categoryId=${category.id}`}
                  label={category.name}
                  onClick={closeMobileMenu}
                />
              ))
            )}

            <MobileLink
              href="/cart"
              label="Cart"
              active={pathname === "/cart"}
              onClick={closeMobileMenu}
            />

            <div className="flex gap-2 pt-3">
              <Link
                href="/login"
                onClick={closeMobileMenu}
                className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                onClick={closeMobileMenu}
                className="flex-1 rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700"
              >
                Create account
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
