/** Skeleton shown while a product's details are loading. */
export function ProductDetailsSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]" aria-hidden="true">
      <div className="space-y-4">
        <div className="h-8 w-2/3 animate-pulse rounded bg-zinc-200" />
        <div className="h-6 w-1/4 animate-pulse rounded bg-zinc-200" />
        <div className="h-5 w-1/5 animate-pulse rounded bg-zinc-200" />
        <div className="mt-6 space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-zinc-200" />
          <div className="h-4 w-full animate-pulse rounded bg-zinc-200" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-200" />
          <div className="h-4 w-4/6 animate-pulse rounded bg-zinc-200" />
        </div>
      </div>
      <div className="h-80 animate-pulse rounded-lg border border-zinc-200 bg-zinc-100" />
    </div>
  );
}
