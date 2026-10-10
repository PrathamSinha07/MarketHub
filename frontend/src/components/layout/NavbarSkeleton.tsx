import { Logo } from "./Logo";
import { container } from "@/lib/ui";

/**
 * Static shell rendered while the interactive navbar streams in.
 * Used as the Suspense fallback in the root layout.
 */
export function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
      <div className={container}>
        <div className="flex h-16 items-center gap-4">
          <Logo />
          <div className="hidden h-9 w-56 animate-pulse rounded-md bg-zinc-100 md:block" />
          <div className="ml-auto hidden h-9 w-24 animate-pulse rounded-md bg-zinc-100 md:block" />
        </div>
      </div>
    </header>
  );
}
