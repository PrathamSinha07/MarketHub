import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
        404
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
        Page not found
      </h1>
      <p className="mt-3 text-sm leading-6 text-zinc-500">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Go home
        </Link>
        <Link
          href="/products"
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Browse products
        </Link>
      </div>
    </div>
  );
}
