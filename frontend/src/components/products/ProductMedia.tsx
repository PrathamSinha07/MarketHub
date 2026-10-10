import { cn } from "@/lib/utils";

type MediaSize = "sm" | "md" | "lg";

const SIZE_STYLES: Record<MediaSize, { initial: string; icon: string }> = {
  sm: { initial: "text-lg", icon: "h-3 w-3" },
  md: { initial: "text-4xl", icon: "h-4 w-4" },
  lg: { initial: "text-6xl", icon: "h-6 w-6" },
};

/**
 * Consistent media area for products.
 *
 * The product model has no image field anywhere in the stack, so every
 * product gets this neutral placeholder — a monogram derived from the
 * real product name. It never renders broken images or invented photos.
 * The placeholder is decorative: product name/price live alongside it.
 */
export function ProductMedia({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: MediaSize;
  className?: string;
}) {
  const initial = name.trim().charAt(0).toUpperCase();
  const styles = SIZE_STYLES[size];

  return (
    <div
      aria-hidden="true"
      className={cn("flex items-center justify-center bg-zinc-100", className)}
    >
      <div className="flex flex-col items-center gap-1.5 text-zinc-300">
        <span
          className={cn(
            "font-semibold uppercase tracking-tight text-zinc-400",
            styles.initial
          )}
        >
          {initial}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className={styles.icon}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 19.5h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0z"
          />
        </svg>
      </div>
    </div>
  );
}
