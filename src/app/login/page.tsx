"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { FieldBlock, FormCard } from "@/components/ScreenChrome";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: signError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signError) {
      setError(signError.message);
      return;
    }
    router.push("/hoje");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-[#0A9396]">
      <div
        className="page-enter mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4"
        style={{
          paddingTop: "max(2.5rem, env(safe-area-inset-top))",
          paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
        }}
      >
        <section className="overflow-hidden rounded-[1.75rem] bg-[#005F73] px-6 py-8 text-center">
          <Image
            src="/brand/well.svg"
            alt="WELL"
            width={160}
            height={67}
            priority
            className="mx-auto h-12 w-auto"
          />
          <p className="mt-4 text-sm font-semibold text-white/80">
            Seu caderno de hábitos — estimativas, não dietas.
          </p>
        </section>

        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-5">
          <FormCard title="Entrar" emoji="🔑" darkHeader>
            <FieldBlock label="E-mail">
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-base font-bold outline-none"
              />
            </FieldBlock>
            <FieldBlock label="Senha">
              <input
                type="password"
                required
                minLength={6}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-base font-bold outline-none"
              />
            </FieldBlock>
          </FormCard>

          {error ? (
            <p className="rounded-2xl bg-[var(--sand)] px-4 py-3 text-sm font-semibold text-[var(--crimson)]">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-[var(--ink)] px-4 py-3.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm font-semibold text-white/80">
          Ainda não tem conta?{" "}
          <Link href="/signup" className="underline underline-offset-2">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
