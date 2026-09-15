"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { BrandLoader } from "@/components/BrandLoader";

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
  const [pending, setPending] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setPending(false);
  }, [pathname]);

  const navigate = useCallback(
    (href: string) => {
      if (href === pathname) return;
      setPending(true);
      startTransition(() => {
        router.push(href);
      });
    },
    [pathname, router],
  );

  useEffect(() => {
    for (const h of ["/hoje", "/jornada", "/conquistas", "/voce"]) {
      router.prefetch(h);
    }
  }, [router]);

  const show = pending || isPending;

  return (
    <Ctx.Provider value={{ pending: show, navigate }}>
      {children}
      {show ? <BrandLoader label="Abrindo…" /> : null}
    </Ctx.Provider>
  );
}
