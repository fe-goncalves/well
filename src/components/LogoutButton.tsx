"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton({
  className,
}: {
  className?: string;
}) {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className={
        className ??
        "inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold text-white"
      }
      aria-label="Sair"
    >
      <span aria-hidden>🚪</span>
      Sair
    </button>
  );
}
