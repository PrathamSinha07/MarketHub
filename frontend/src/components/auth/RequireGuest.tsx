"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * Renders children only for guests. Users who arrive on the page
 * already signed in are redirected to the home page. Users who sign
 * in on the page itself are left to the form's own navigation.
 */
export function RequireGuest({ children }: { children: ReactNode }) {
  const { user, restoring } = useAuth();
  const router = useRouter();
  const wasRestoring = useRef(true);

  useEffect(() => {
    if (wasRestoring.current && !restoring && user) {
      router.replace("/");
    }
    wasRestoring.current = restoring;
  }, [restoring, user, router]);

  if (restoring || user) {
    return null;
  }

  return <>{children}</>;
}
