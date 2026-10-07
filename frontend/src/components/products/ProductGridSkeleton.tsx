/** Skeleton shown while product data is loading. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4"
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, index) => (
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
