import { Logo } from "./Logo";

/**
 * Static shell rendered while the interactive navbar streams in.
 * Used as the Suspense fallback in the root layout.
 */
export function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />
        <div className="hidden h-4 w-48 animate-pulse rounded bg-zinc-100 md:block" />
      </div>
    </header>
  );
}
