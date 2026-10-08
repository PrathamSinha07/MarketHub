import type { ReactNode } from "react";
import { RequireSeller } from "@/components/auth/RequireSeller";
import { SellerDashboardShell } from "@/components/seller/SellerDashboardShell";

/**
 * Seller area. `RequireSeller` composes the existing `RequireAuth`
 * redirect (guests → /login?next=…) with a session-role check, and the
 * shell provides the shared dashboard navigation.
 */
export default function SellerLayout({ children }: { children: ReactNode }) {
  return (
    <RequireSeller>
      <SellerDashboardShell>{children}</SellerDashboardShell>
    </RequireSeller>
  );
}
