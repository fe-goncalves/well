import type { ReactNode } from "react";

/** Shell full-bleed com safe-area para PWA / notch. */
export function AppShell({
  bg,
  children,
  withNav = true,
  className = "",
}: {
  bg: string;
  children: ReactNode;
  withNav?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-dvh w-full flex-1 flex-col overflow-x-hidden ${className}`}
      style={{ backgroundColor: bg }}
    >
      <div
        className={`mx-auto flex w-full max-w-lg flex-1 flex-col px-4 sm:max-w-2xl ${
          withNav
            ? "pb-[calc(5.5rem+env(safe-area-inset-bottom))]"
            : "pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        }`}
        style={{
          paddingTop: "max(1.25rem, env(safe-area-inset-top))",
        }}
      >
        {children}
      </div>
    </div>
  );
}
