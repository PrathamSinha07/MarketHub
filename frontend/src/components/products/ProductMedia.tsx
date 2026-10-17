import { cn } from "@/lib/utils";

type MediaSize = "sm" | "md" | "lg";

const SIZE_STYLES: Record<MediaSize, { initial: string; icon: string }> = {
  sm: { initial: "text-base", icon: "hidden" },
  md: { initial: "text-4xl", icon: "h-4 w-4" },
  lg: { initial: "text-6xl", icon: "h-6 w-6" },
};

/**
 * Neutral placeholder tones. All four are grey families (zinc, slate,
 * stone, neutral) so product tiles stay restrained and consistent —
 * no gradients, no fabricated product photography.
 */
const TONES = [
  { bg: "bg-zinc-100", shape: "bg-zinc-200", ink: "text-zinc-500" },
  { bg: "bg-slate-100", shape: "bg-slate-200", ink: "text-slate-500" },
  { bg: "bg-stone-100", shape: "bg-stone-200", ink: "text-stone-500" },
  { bg: "bg-neutral-100", shape: "bg-neutral-200", ink: "text-neutral-500" },
] as const;

/** Deterministic tone so a product always gets the same tile. */
function toneFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash + name.charCodeAt(i) * (i + 1)) % TONES.length;
  }
  return TONES[hash];
}

/**
 * Consistent media area for products.
 *
 * The product model has no image field anywhere in the stack, so every
 * product gets this neutral placeholder: a soft monogram tile derived
 * from the real product name. It is decorative (aria-hidden) — the
 * product name and price always render alongside it — and it never
 * implies placeholder content is real inventory photography.
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
  const trimmed = name.trim();
  const initial = trimmed.charAt(0).toUpperCase();
  const styles = SIZE_STYLES[size];
  const tone = toneFor(trimmed || "p");

  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative isolate flex items-center justify-center overflow-hidden",
        tone.bg,
        className
      )}
    >
      {/* Decorative geometry keeps the tile feeling composed without
          inventing imagery. */}
      <span
        className={cn(
          "absolute -right-8 -top-10 h-28 w-28 rounded-full sm:h-32 sm:w-32",
          tone.shape,
          "opacity-70"
        )}
      />
      <span
        className={cn(
          "absolute -bottom-10 -left-6 h-24 w-24 rounded-full sm:h-28 sm:w-28",
          tone.shape,
          "opacity-50"
        )}
      />

      <div className="relative flex flex-col items-center gap-1.5">
        <span
          className={cn(
            "font-semibold tracking-tight",
            tone.ink,
            styles.initial
          )}
        >
          {initial}
        </span>
        {styles.icon !== "hidden" && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={cn(styles.icon, tone.ink, "opacity-70")}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
            />
          </svg>
        )}
      </div>
    </div>
  );
}
