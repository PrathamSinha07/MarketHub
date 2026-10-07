import Link from "next/link";

interface SectionHeaderProps {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}

export function SectionHeader({
  title,
  description,
  actionHref,
  actionLabel,
}: SectionHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 text-sm text-zinc-500">{description}</p>
        )}
      </div>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          {actionLabel}
          <span aria-hidden="true">→</span>
        </Link>
      )}
    </div>
  );
}
