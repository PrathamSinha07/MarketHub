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

  if (restoring || user) {
    return null;
  }

  return <>{children}</>;
}
