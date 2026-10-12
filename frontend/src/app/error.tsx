"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-red-600">
        Something went wrong
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
        Unexpected error
      </h1>
      <p className="mt-3 text-sm leading-6 text-zinc-500">
        An unexpected error occurred. Please try again.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
