/** Skeleton shown while the product listing initializes. */
export function ProductsBrowserSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-8 w-24 animate-pulse rounded-full bg-zinc-200"
          />
        ))}
      </div>
      <ProductGridSkeletonFromBrowser />
    </div>
  );
}

function ProductGridSkeletonFromBrowser() {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4"
      aria-hidden="true"
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="rounded-lg border border-zinc-200 bg-white p-4"
        >
          <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-200" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-zinc-200" />
          <div className="mt-4 h-5 w-1/3 animate-pulse rounded bg-zinc-200" />
          <div className="mt-4 h-9 w-full animate-pulse rounded-md bg-zinc-200" />
        </div>
      ))}
    </div>
  );
}
