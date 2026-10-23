/**
 * Shared category theming.
 *
 * Each department gets its own tint and glyph, keyed by keyword match on the
 * category name so the design keeps working for categories we haven't seeded.
 * Used by the product media fallback and the homepage category cards, so the
 * same department always gets the same visual identity across the storefront.
 */

export type CategoryTheme = {
  readonly bg: string;
  readonly ink: string;
  /** Heroicons-style outline path (24×24). */
  readonly path: string;
};

type ThemeEntry = CategoryTheme & {
  /** Lowercased name fragments this theme claims (e.g. "kitchen"). */
  readonly match: readonly string[];
};

export const CATEGORY_THEMES = [
  {
    match: ["electronic", "tech", "audio", "camera", "computer"],
    bg: "bg-gradient-to-br from-sky-50 via-white to-indigo-100",
    ink: "text-sky-700",
    // Monitor glyph
    path: "M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25",
  },
  {
    match: ["home", "kitchen", "furniture", "garden"],
    bg: "bg-gradient-to-br from-amber-50 via-white to-orange-100",
    ink: "text-amber-700",
    // House glyph
    path: "M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75",
  },
  {
    match: ["sport", "outdoor", "fitness", "camping", "travel"],
    bg: "bg-gradient-to-br from-emerald-50 via-white to-teal-100",
    ink: "text-emerald-700",
    // Mountain glyph
    path: "M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z",
  },
  {
    match: ["office", "stationery", "book", "paper", "art"],
    bg: "bg-gradient-to-br from-violet-50 via-white to-purple-100",
    ink: "text-violet-700",
    // Pencil glyph
    path: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
  },
  {
    match: ["bag", "fashion", "accessor", "apparel", "jewel"],
    bg: "bg-gradient-to-br from-orange-50 via-white to-rose-100",
    ink: "text-orange-700",
    // Shopping bag glyph
    path: "M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z",
  },
] as const satisfies readonly ThemeEntry[];

export const DEFAULT_THEME: CategoryTheme = {
  bg: "bg-gradient-to-br from-zinc-100 via-white to-zinc-200",
  ink: "text-zinc-500",
  // Package glyph
  path: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z",
};

export function themeFor(categoryName?: string | null): CategoryTheme {
  const needle = (categoryName ?? "").toLowerCase();
  return (
    CATEGORY_THEMES.find((theme) =>
      theme.match.some((keyword) => needle.includes(keyword))
    ) ?? DEFAULT_THEME
  );
}
