import { cn } from "@/lib/utils";
import { themeFor } from "@/lib/categoryTheme";

/* eslint-disable @next/next/no-img-element -- Product images can be seller-supplied absolute URLs; routing those through the Next image optimizer would require an allowlist we don't control. Plain <img> is the safe, deliberate choice here. */

type MediaSize = "sm" | "md" | "lg";

const SIZE_STYLES: Record<MediaSize, string> = {
  sm: "h-12 w-12 rounded-md",
  md: "h-full w-full",
  lg: "h-full w-full",
};

const ICON_SIZE: Record<MediaSize, string> = {
  sm: "h-5 w-5",
  md: "h-10 w-10",
  lg: "h-16 w-16",
};

/**
 * Product media area.
 *
 * Products with an `imageUrl` render the real photo (consistent aspect
 * ratio, object-cover, lazy loaded). Products without one get a deliberate
 * category-specific fallback — tinted surface plus department glyph, shared
 * with the homepage category cards — so the grid never shows a wall of
 * identical blank boxes.
 */
export function ProductMedia({
  name,
  imageUrl,
  categoryName,
  size = "md",
  className,
}: {
  name: string;
  imageUrl?: string | null;
  categoryName?: string | null;
  size?: MediaSize;
  className?: string;
}) {
  const frame = cn("relative isolate overflow-hidden", SIZE_STYLES[size], className);

  if (imageUrl) {
    return (
      <div className={frame}>
        <img
          src={imageUrl}
          alt={name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const theme = themeFor(categoryName);

  return (
    <div aria-hidden="true" className={cn(frame, "flex items-center justify-center", theme.bg)}>
      {/* Soft corner geometry gives the tile composition without noise. */}
      <span className="absolute -right-10 -top-12 h-28 w-28 rounded-full bg-white/50 sm:h-32 sm:w-32" />
      <span className="absolute -bottom-12 -left-8 h-24 w-24 rounded-full bg-white/40 sm:h-28 sm:w-28" />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.25}
        stroke="currentColor"
        className={cn("relative opacity-80", ICON_SIZE[size], theme.ink)}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={theme.path} />
      </svg>
    </div>
  );
}
