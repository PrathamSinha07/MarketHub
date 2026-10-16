import Link from "next/link";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { RequireGuest } from "@/components/auth/RequireGuest";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your MarketHub account.",
};

/**
 * Sign-in page.
 *
 * The `next` return URL is read from the URL on the client (see LoginForm)
 * instead of awaiting `searchParams` here. That keeps the form out of a
 * deferred <Suspense> boundary: auth-guarded markup then hydrates together
 * with the root, so the session restore can never race this page's
 * hydration and trigger a hydration mismatch.
 */
export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <RequireGuest>
          <AuthCard
            title="Sign in to your account"
            subtitle="Enter your email and password to access your MarketHub account."
          >
            <LoginForm />
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
      </div>
    </div>
  );
}
