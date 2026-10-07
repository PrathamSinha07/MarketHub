import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { RequireGuest } from "@/components/auth/RequireGuest";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your MarketHub account.",
};

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Suspense
          fallback={
            <div
              className="h-72 animate-pulse rounded-lg border border-zinc-200 bg-zinc-100"
              aria-hidden="true"
            />
          }
        >
          <LoginPageContent {...props} />
        </Suspense>
      </div>
    </div>
  );
}

async function LoginPageContent(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const next =
    typeof searchParams.next === "string" ? searchParams.next : undefined;

  return (
    <RequireGuest>
      <AuthCard
        title="Sign in to your account"
        subtitle="Enter your email and password to access your MarketHub account."
      >
        <LoginForm redirectTo={next} />
        <p className="mt-6 text-center text-sm text-zinc-500">
          New to MarketHub?{" "}
          <Link
            href="/register"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Create an account
          </Link>
        </p>
      </AuthCard>
    </RequireGuest>
  );
}
