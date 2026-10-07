"use client";

import { useEffect, useState } from "react";

/**
 * Copyright line with the current year. The year is computed
 * on the client (in a timer callback after mount) so the value
 * is never frozen at prerender time.
 */
export function FooterCopyright() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setYear(new Date().getFullYear());
    });
    return () => clearTimeout(timer);
  }, []);

  return (
    <p className="text-xs text-zinc-400">
      © {year} MarketHub. All rights reserved.
    </p>
  );
}
