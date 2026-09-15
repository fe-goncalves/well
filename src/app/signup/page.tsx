"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { FieldBlock, FormCard } from "@/components/ScreenChrome";

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();
    const { data, error: signError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || undefined },
      },
    });
    setLoading(false);
    if (signError) {
      setError(signError.message);
      return;
    }
    if (data.session) {
      router.push("/onboarding");
      router.refresh();
      return;
    }
    setInfo(
      "Conta criada. Se o Supabase pedir confirmação de e-mail, abra o link e depois faça login.",
    );
  }

  return (
    <div className="min-h-full flex-1 bg-[#0A9396]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
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
            Crie sua conta para começar.
          </p>
        </section>

        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-5">
          <FormCard title="Nova conta" emoji="✨" darkHeader>
            <FieldBlock label="Como prefere ser chamado">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-transparent text-base font-bold outline-none"
              />
            </FieldBlock>
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
            <FieldBlock label="Senha (mín. 6)">
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
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
          {info ? (
            <p className="rounded-2xl bg-[var(--mint)] px-4 py-3 text-sm font-semibold text-[var(--deep)]">
              {info}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-[var(--ink)] px-4 py-3.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {loading ? "Criando…" : "Criar conta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm font-semibold text-white/80">
          Já tem conta?{" "}
          <Link href="/login" className="underline underline-offset-2">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
