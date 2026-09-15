"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

type NavCtx = {
  pending: boolean;
  navigate: (href: string) => void;
};

const Ctx = createContext<NavCtx>({
  pending: false,
  navigate: () => {},
});

export function useAppNav() {
  return useContext(Ctx);
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = useCallback(
    (href: string) => {
      if (href === pathname) return;
      router.push(href);
    },
    [pathname, router],
  );

  useEffect(() => {
    for (const h of ["/hoje", "/jornada", "/conquistas", "/voce", "/jornada?periodo=semana", "/jornada?periodo=mes"]) {
      router.prefetch(h);
    }
  }, [router]);

  return (
    <Ctx.Provider value={{ pending: false, navigate }}>{children}</Ctx.Provider>
  );
}
