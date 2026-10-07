"use client";

import { useState, type FormEvent } from "react";
import { authService } from "@/services/authService";
import { errorMessage } from "@/lib/api-client";
import { isApiError } from "@/lib/utils";
import type { AuthResponse } from "@/types/auth";
import type { FieldErrors } from "@/types/api";
import { AuthCard } from "./AuthCard";
import { FormField, inputClass, inputErrorClass } from "@/components/shared/FormField";
import { cn } from "@/lib/utils";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AuthResponse | null>(null);

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      errors.email = "Invalid email format";
    }
    if (!password) {
      errors.password = "Password is required";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await authService.login({
        email: email.trim(),
        password,
      });
      // Session persistence is intentionally not implemented yet.
      setResult(response);
    } catch (error) {
      if (isApiError(error)) {
        setServerError(error.message);
        if (error.fieldErrors) {
          setFieldErrors(error.fieldErrors);
        }
      } else {
        setServerError(errorMessage(error));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <AuthCard
        title="Sign-in successful"
        subtitle="Your credentials were verified by the MarketHub API."
      >
        <dl className="space-y-3 rounded-md bg-zinc-50 px-4 py-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Email</dt>
            <dd className="font-medium text-zinc-900">{result.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Role</dt>
            <dd className="font-medium text-zinc-900">{result.role}</dd>
          </div>
        </dl>
        <p className="mt-4 rounded-md bg-zinc-50 px-3 py-2 text-xs leading-5 text-zinc-500">
          Session persistence is not enabled yet. The authentication state
          manager will be connected in the next step, after which you will be
          signed in automatically.
        </p>
      </AuthCard>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {serverError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {serverError}
        </p>
      )}

      <FormField label="Email" htmlFor="login-email" error={fieldErrors.email}>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className={cn(inputClass, fieldErrors.email && inputErrorClass)}
        />
      </FormField>

      <FormField
        label="Password"
        htmlFor="login-password"
        error={fieldErrors.password}
      >
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={cn(inputClass, fieldErrors.password && inputErrorClass)}
        />
      </FormField>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
