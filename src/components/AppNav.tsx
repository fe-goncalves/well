import Link from "next/link";

const ITEMS = [
  { href: "/hoje", label: "Hoje", emoji: "🏠" },
  { href: "/jornada", label: "Jornada", emoji: "🗺️" },
  { href: "/conquistas", label: "Conquistas", emoji: "🏆" },
  { href: "/voce", label: "Você", emoji: "👤" },
] as const;

export function AppNav({ active }: { active: (typeof ITEMS)[number]["href"] }) {
  return (
    <nav
      aria-label="Principal"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))]"
    >
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-1 rounded-full border border-black/40 bg-[var(--ink)] p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        {ITEMS.map((item) => {
          const isActive = item.href === active;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-2.5 transition-colors ${
                isActive
                  ? "bg-white text-[var(--ink)]"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <span className="text-lg leading-none" aria-hidden>
                {item.emoji}
              </span>
              <span className="truncate text-[10px] font-bold tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
