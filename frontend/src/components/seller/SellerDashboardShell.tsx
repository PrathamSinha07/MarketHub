"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { cn, formatRole } from "@/lib/utils";

/* ---------- icons (heroicons outline, 24px) ---------- */

function OverviewIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18V15zM6 15a2.25 2.25 0 012.25-2.25H10.5A2.25 2.25 0 0112.75 15v2.25A2.25 2.25 0 0110.5 19.5H8.25A2.25 2.25 0 016 17.25V15z"
      />
    </svg>
  );
}

function ProductsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
      />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
      />
    </svg>
  );
}

function StorefrontIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-5 w-5 shrink-0"
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

function SignOutIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
      />
    </svg>
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

/* ---------- navigation ---------- */

interface NavItemConfig {
  href: string;
  label: string;
  icon: ReactNode;
  /** Match the path exactly (used for /seller). */
  exact?: boolean;
}

const NAV_ITEMS: NavItemConfig[] = [
  { href: "/seller", label: "Overview", icon: <OverviewIcon />, exact: true },
  { href: "/seller/products", label: "Products", icon: <ProductsIcon /> },
];

function isActive(pathname: string, item: NavItemConfig): boolean {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function NavList({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          </li>
        );
      })}
      <li>
        <span
          aria-disabled="true"
          className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-400"
          title="Seller orders are not available yet"
        >
          <OrdersIcon />
          Orders
          <span className="ml-auto rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Soon
          </span>
        </span>
      </li>
    </ul>
  );
}

function MarketplaceLink({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
    >
      <StorefrontIcon />
      View marketplace
    </Link>
  );
}

/* ---------- shell ---------- */

/**
 * Shared chrome for the seller dashboard: sticky desktop sidebar and a
 * collapsible mobile bar with the same navigation, plus account info
 * and sign out. Page content renders in the main panel.
 */
export function SellerDashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  // The open panel is keyed to the path it was opened on, so it
  // closes automatically when the route changes — no effect needed.
  const [openNavPath, setOpenNavPath] = useState<string | null>(null);
  const mobileNavOpen = openNavPath === pathname;

  function toggleMobileNav() {
    setOpenNavPath(mobileNavOpen ? null : pathname);
  }

  function closeMobileNav() {
    setOpenNavPath(null);
  }

  function handleLogout() {
    closeMobileNav();
    logout();
  }

  return (
    <div className="flex min-h-[calc(100vh_-_4rem)] flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 self-start border-r border-zinc-200 bg-white md:sticky md:top-16 md:block md:h-[calc(100vh_-_4rem)]">
        <div className="flex h-full flex-col p-4">
          <div className="border-b border-zinc-100 pb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Seller dashboard
            </p>
            {user && (
              <>
                <p className="mt-2 truncate text-sm font-medium text-zinc-900">
                  {user.email}
                </p>
                <p className="text-xs text-zinc-500">{formatRole(user.role)}</p>
              </>
            )}
          </div>

          <nav aria-label="Seller dashboard" className="mt-4 flex-1">
            <NavList pathname={pathname} />
          </nav>

          <div className="space-y-1 border-t border-zinc-100 pt-3">
            <MarketplaceLink />
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              <SignOutIcon />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main panel */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 md:hidden">
          <p className="text-sm font-semibold text-zinc-900">
            Seller dashboard
          </p>
          <button
            type="button"
            onClick={toggleMobileNav}
            aria-expanded={mobileNavOpen}
            aria-controls="seller-mobile-nav"
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100"
          >
            {mobileNavOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        {mobileNavOpen && (
          <nav
            id="seller-mobile-nav"
            aria-label="Seller dashboard"
            className="space-y-1 border-b border-zinc-200 bg-white px-3 py-3 md:hidden"
          >
            <NavList pathname={pathname} onNavigate={closeMobileNav} />
            <div className="space-y-1 border-t border-zinc-100 pt-3">
              <MarketplaceLink onNavigate={closeMobileNav} />
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                <SignOutIcon />
                Sign out
              </button>
            </div>
          </nav>
        )}

        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
