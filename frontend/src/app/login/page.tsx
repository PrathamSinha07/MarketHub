import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your MarketHub account.",
};

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
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
      </div>
    </div>
  );
}
