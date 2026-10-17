import Link from "next/link";
import { Fragment } from "react";

export interface Crumb {
  label: string;
  /** Omitted on the final (current) item. */
  href?: string;
}

/** Shared breadcrumb trail used by deep pages (e.g. product details). */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <Fragment key={`${item.label}-${index}`}>
              <li className="min-w-0">
                {item.href && !last ? (
                  <Link href={item.href} className="hover:text-zinc-900">
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={
                      last
                        ? "block max-w-[12rem] truncate font-medium text-zinc-900 sm:max-w-sm"
                        : undefined
                    }
                    aria-current={last ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
              {!last && (
                <li aria-hidden="true" className="text-zinc-300">
                  /
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
