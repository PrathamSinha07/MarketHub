import type { ReactNode } from "react";
import { RequireSeller } from "@/components/auth/RequireSeller";
import { SellerDashboardShell } from "@/components/seller/SellerDashboardShell";

/**
 * Seller area. `RequireSeller` composes the existing `RequireAuth`
 * redirect (guests → /login?next=…) with a session-role check, and the
 * shell provides the shared dashboard navigation.
 *
 * The auth gate and dashboard shell read `usePathname()` at runtime,
 * which cannot be prerendered for dynamic routes under this layout
 * (e.g. /seller/products/[id]/edit), so the segment is marked as a
 * blocking route per the Next.js `instant` config.
 */
export const instant = false;

export default function SellerLayout({ children }: { children: ReactNode }) {
  return (
    <RequireSeller>
      <SellerDashboardShell>{children}</SellerDashboardShell>
    </RequireSeller>
  );
}
