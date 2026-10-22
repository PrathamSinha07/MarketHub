"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { safeRedirectPath } from "@/lib/utils";

/**
 * Renders children only for guests. Once session restoration has
 * completed, authenticated users are redirected away — whether they
 * arrived already signed in, were signed in from another tab, or
 * signed in on the page itself. The redirect honors the same `next`
 * parameter the login form uses, so a successful in-page sign-in and
 * this guard converge on the same destination.
 */
export function RequireGuest({ children }: { children: ReactNode }) {
  const { user, restoring } = useAuth();
  const router = useRouter();
  // Captured once at mount: the login form navigates as soon as the
  // sign-in resolves, so reading the URL at redirect time could see
  // an already-changed address bar.
  const nextRef = useRef<string | null>(null);

  useEffect(() => {
    nextRef.current = new URLSearchParams(window.location.search).get("next");
  }, []);

  useEffect(() => {
    if (restoring || !user) {
      return;
    }
    router.replace(safeRedirectPath(nextRef.current ?? undefined));
  }, [restoring, user, router]);

  if (restoring) {
    // Card-shaped placeholder matching AuthCard's footprint, so the form
    // appears in place (instead of a blank frame) while the session is
    // being restored.
    return (
      <div
        className="w-full rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"
        aria-hidden="true"
      >
        <div className="h-7 w-28 animate-pulse rounded bg-zinc-200" />
        <div className="mt-8 h-6 w-56 animate-pulse rounded bg-zinc-200" />
        <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-zinc-100" />
        <div className="mt-8 space-y-4">
          <div className="h-10 animate-pulse rounded-md bg-zinc-100" />
          <div className="h-10 animate-pulse rounded-md bg-zinc-100" />
          <div className="h-10 animate-pulse rounded-md bg-zinc-100" />
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return <>{children}</>;
}
