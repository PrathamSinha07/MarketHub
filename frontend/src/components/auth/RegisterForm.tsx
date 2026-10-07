"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { errorMessage } from "@/lib/api-client";
import { cn, isApiError } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/types/auth";
import type { FieldErrors } from "@/types/api";
import { AuthCard } from "./AuthCard";
import {
  FormField,
  inputClass,
  inputErrorClass,
} from "@/components/shared/FormField";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("ROLE_CUSTOMER");
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSeller = role === "ROLE_SELLER";

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!firstName.trim()) {
      errors.firstName = "First name is required";
    }
    if (!lastName.trim()) {
      errors.lastName = "Last name is required";
    }
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      errors.email = "Invalid email format";
    }
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    if (isSeller && !storeName.trim()) {
      errors.storeName = "Store name is required for seller role";
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
      // The backend issues a session with the registration
      // response, so the new account is signed in immediately.
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        role,
        storeName: isSeller ? storeName.trim() : undefined,
        storeDescription: isSeller ? storeDescription.trim() : undefined,
      });
      router.replace("/");
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

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {serverError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {serverError}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="First name"
          htmlFor="register-firstName"
          error={fieldErrors.firstName}
        >
          <input
            id="register-firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            className={cn(inputClass, fieldErrors.firstName && inputErrorClass)}
          />
        </FormField>

        <FormField
          label="Last name"
          htmlFor="register-lastName"
          error={fieldErrors.lastName}
        >
          <input
            id="register-lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            className={cn(inputClass, fieldErrors.lastName && inputErrorClass)}
          />
        </FormField>
      </div>

      <FormField label="Email" htmlFor="register-email" error={fieldErrors.email}>
        <input
          id="register-email"
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
        htmlFor="register-password"
        error={fieldErrors.password}
        hint="At least 6 characters."
      >
        <input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={cn(inputClass, fieldErrors.password && inputErrorClass)}
        />
      </FormField>

      <FormField label="Account type" htmlFor="register-role" error={fieldErrors.role}>
        <select
          id="register-role"
          name="role"
          value={role}
          onChange={(event) => setRole(event.target.value as Role)}
          className={cn(inputClass, fieldErrors.role && inputErrorClass)}
        >
          <option value="ROLE_CUSTOMER">Customer — I want to buy</option>
          <option value="ROLE_SELLER">Seller — I want to sell</option>
        </select>
      </FormField>

      {isSeller && (
        <>
          <FormField
            label="Store name"
            htmlFor="register-storeName"
            error={fieldErrors.storeName}
          >
            <input
              id="register-storeName"
              name="storeName"
              type="text"
              value={storeName}
              onChange={(event) => setStoreName(event.target.value)}
              placeholder="e.g. Northwind Electronics"
              className={cn(inputClass, fieldErrors.storeName && inputErrorClass)}
            />
          </FormField>

          <FormField
            label="Store description"
            htmlFor="register-storeDescription"
          >
            <textarea
              id="register-storeDescription"
              name="storeDescription"
              rows={3}
              value={storeDescription}
              onChange={(event) => setStoreDescription(event.target.value)}
              placeholder="What does your store offer?"
              className={cn(inputClass, "resize-y")}
            />
          </FormField>
        </>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
