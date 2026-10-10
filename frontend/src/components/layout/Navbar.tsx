"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useCategories } from "@/hooks/useCategories";
import { cn, formatRole } from "@/lib/utils";
import { container } from "@/lib/ui";
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-4 w-4 shrink-0 text-zinc-400"
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

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className ?? "h-5 w-5"}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
      />
    </svg>
  );
}

/**
 * Search box that navigates to `/products?q=…`, where the product
 * browser filters the catalog client-side (the backend has no search
 * parameter — see `components/products/ProductsBrowser.tsx`).
 */
function SearchForm({
  id,
  className,
  onSubmitted,
}: {
  id: string;
  className?: string;
  onSubmitted?: () => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = value.trim();
    router.push(query ? `/products?q=${encodeURIComponent(query)}` : "/products");
    onSubmitted?.();
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn("relative", className)}
    >
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
        <SearchIcon />
      </span>
      <input
        id={id}
        type="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search products"
        autoComplete="off"
        className="h-9 w-full rounded-md border border-zinc-300 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400"
      />
    </form>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { user, restoring, logout } = useAuth();
  const { count: cartCount, restricted: cartRestricted } = useCart();
  const { data: categories } = useCategories();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const isProductsActive =
    pathname === "/products" || pathname.startsWith("/products/");
  const rootCategories = categories ?? [];
  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Cart endpoints are ROLE_CUSTOMER-only. Guests see the cart link
  // (it routes to sign-in); seller/admin accounts never get a cart, so
  // the link is hidden for them rather than leading to a 403.
  const showCart = !restoring && (user === null || !cartRestricted);
  const cartCountLabel =
    cartCount > 0
      ? `Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`
      : "Cart";

  function handleLogout() {
    logout();
    setMobileMenuOpen(false);
    setCategoriesOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
      <div className={cn(container, "flex h-16 items-center gap-3")}>
        <Logo />

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
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
        </nav>

        <SearchForm
          id="nav-search"
          className="hidden min-w-0 md:block md:flex-1 md:max-w-xs lg:max-w-sm"
        />

        <div className="ml-auto flex items-center gap-1 md:gap-2">
          {showCart && (
            <Link
              href="/cart"
              aria-label={cartCountLabel}
              aria-current={pathname === "/cart" ? "page" : undefined}
              className={cn(
                "relative rounded-md p-2 transition-colors",
                pathname === "/cart"
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              <CartIcon />
              {cartCount > 0 && (
                <span
                  className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-semibold leading-none text-white"
                  aria-hidden="true"
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          )}

          {restoring ? (
            <div
              className="hidden h-9 w-36 animate-pulse rounded-md bg-zinc-100 lg:block"
              aria-hidden="true"
            />
          ) : user ? (
            <>
              <div className="hidden text-right lg:block">
                <p className="max-w-44 truncate text-sm font-medium text-zinc-900">
                  {user.email}
                </p>
                <p className="text-xs text-zinc-500">{formatRole(user.role)}</p>
              </div>
              {user.role === "ROLE_SELLER" && (
                <Link
                  href="/seller"
                  className="hidden rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 lg:inline-flex"
                >
                  Seller dashboard
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="hidden rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 lg:inline-flex"
              >
                Sign out
              </button>
            </>
          ) : (
            <div className="hidden items-center gap-1 lg:flex">
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
          )}

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
      </div>

      {mobileMenuOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile"
          className="border-t border-zinc-200 bg-white md:hidden"
        >
          <div className="space-y-1 px-4 py-3">
            <SearchForm
              id="mobile-nav-search"
              className="pb-2"
              onSubmitted={closeMobileMenu}
            />
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

            {showCart && (
              <MobileLink
                href="/cart"
                label={cartCount > 0 ? `Cart (${cartCount})` : "Cart"}
                active={pathname === "/cart"}
                onClick={closeMobileMenu}
              />
            )}

            {restoring ? (
              <div
                className="mt-3 h-10 animate-pulse rounded-md bg-zinc-100"
                aria-hidden="true"
              />
            ) : user ? (
              <div className="pt-3">
                <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Account
                </p>
                <p className="truncate px-3 pb-1 text-sm font-medium text-zinc-900">
                  {user.email}
                </p>
                <p className="px-3 pb-2 text-xs text-zinc-500">
                  {formatRole(user.role)}
                </p>
                {user.role === "ROLE_SELLER" && (
                  <MobileLink
                    href="/seller"
                    label="Seller dashboard"
                    onClick={closeMobileMenu}
                  />
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Sign out
                </button>
              </div>
            ) : (
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
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
