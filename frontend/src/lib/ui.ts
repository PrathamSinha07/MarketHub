/**
 * Shared design tokens for the buyer-facing UI.
 *
 * These are plain class strings (not components) so they compose with
 * `cn()` and stay tree-shakeable. Keep them consistent with the seller
 * dashboard, which uses the same zinc + indigo-600 palette.
 */

/** Page container: consistent horizontal padding and max width. */
export const container = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

/** Narrow container for focused content (auth cards, cart, dialogs). */
export const containerNarrow = "mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60";

export const buttonPrimary = `${buttonBase} bg-indigo-600 text-white hover:bg-indigo-700`;
export const buttonSecondary = `${buttonBase} border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50`;
export const buttonQuiet = `${buttonBase} text-zinc-700 hover:bg-zinc-100`;

/** Default surface: white card with a hairline border. */
export const card = "rounded-lg border border-zinc-200 bg-white";

/** Text input / select styling shared by forms. */
export const input =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400";

/** Muted section background (hero, alternating bands). */
export const subtleBand = "border-b border-zinc-200 bg-zinc-50";
