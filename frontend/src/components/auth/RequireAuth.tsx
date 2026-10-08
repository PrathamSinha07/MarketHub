"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function AuthGuardSkeleton() {
  return (
    <div
      className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8"
      aria-hidden="true"
    >
      <div className="h-8 w-40 animate-pulse rounded bg-zinc-200" />
      <div className="mt-6 h-40 w-full animate-pulse rounded-lg border border-zinc-200 bg-zinc-100" />
    </div>
  );
}

/**
 * Renders children only for signed-in users. Guests are
 * redirected to the sign-in page with a `next` return URL.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, restoring } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!restoring && !user) {
      // Read the query on the client inside the effect: avoids
      // `useSearchParams` (which would require a Suspense boundary
      // around the protected page) and captures the full URL.
      const query = window.location.search;
      const returnTo = query ? `${pathname}${query}` : pathname;
      router.replace(`/login?next=${encodeURIComponent(returnTo)}`);
    }
  }, [restoring, user, router, pathname]);

  if (restoring) {
    return <AuthGuardSkeleton />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
