"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function FeedbackToast() {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const xp = search.get("xp");
    const badges = search.get("badges");
    const level = search.get("level");
    if (!xp && !badges && !level) return;

    const parts: string[] = [];
    if (xp) parts.push(`+${xp} XP`);
    if (level) parts.push(`nível ${level}`);
    if (badges) parts.push(`badge: ${badges.split(",").join(", ")}`);
    setText(parts.join(" · "));

    const t = setTimeout(() => {
      setText(null);
      router.replace(pathname);
    }, 3200);
    return () => clearTimeout(t);
  }, [search, router, pathname]);

  if (!text) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-[var(--mint)] shadow-lg">
        {text}
      </div>
    </div>
  );
}
