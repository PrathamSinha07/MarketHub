import { Logo } from "@/components/layout/Logo";
import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

/** Card shell shared by the sign-in and registration pages. */
export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <Logo />
      <div className="mt-6">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          {title}
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500">{subtitle}</p>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
