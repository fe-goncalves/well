"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { BiologicalSex } from "@/domain/tmb";
import { FieldBlock, FormCard } from "@/components/ScreenChrome";

export default function OnboardingPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [sex, setSex] = useState<BiologicalSex>("male");
  const [birthDate, setBirthDate] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [rhythmMode, setRhythmMode] = useState<"light" | "standard" | "firm">(
    "standard",
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setError("Sessão expirada. Faça login de novo.");
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: displayName || null,
        biological_sex: sex,
        birth_date: birthDate,
        height_cm: Number(heightCm),
        weight_kg: Number(weightKg),
        activity_factor: 1.0,
        rhythm_mode: rhythmMode,
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    await supabase.from("weight_logs").upsert(
      {
        user_id: user.id,
        weight_kg: Number(weightKg),
        logged_on: today,
      },
      { onConflict: "user_id,logged_on" },
    );

    setLoading(false);
    router.push("/hoje");
    router.refresh();
  }

  return (
    <div className="min-h-full flex-1 bg-[#001219]">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-10 pt-6 sm:max-w-2xl">
        <header className="flex items-center justify-between gap-4">
          <Image
            src="/brand/well.svg"
            alt="WELL"
            width={120}
            height={50}
            className="h-8 w-auto brightness-0 invert"
          />
          <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
            Bem-vindo
          </span>
        </header>

        <section className="relative mt-6 overflow-hidden rounded-[1.75rem] bg-[#005F73] px-5 py-6">
          <p className="text-sm font-bold uppercase tracking-wide text-white/70">
            Onboarding
          </p>
          <p className="mt-2 font-sans text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Seus dados
          </p>
          <p className="mt-2 text-sm font-semibold text-white/80">
            TMB só como referência ao criar objetivos. O saldo do dia conta só o
            que você lançar.
          </p>
        </section>

        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-5">
          <FormCard title="Perfil" emoji="👤" darkHeader>
            <FieldBlock label="Como prefere ser chamado">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-transparent text-base font-bold outline-none"
              />
            </FieldBlock>

            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
              <p className="text-[10px] font-bold tracking-[0.16em] text-[var(--muted)] uppercase">
                Sexo biológico
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(
                  [
                    ["male", "Masculino"],
                    ["female", "Feminino"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSex(value)}
                    className={`rounded-xl px-3 py-2.5 text-sm font-bold ${
                      sex === value
                        ? "bg-[var(--teal)] text-white"
                        : "bg-[var(--sand)] text-[var(--ink)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <FieldBlock label="Data de nascimento">
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-transparent text-sm font-bold outline-none"
              />
            </FieldBlock>

            <div className="grid grid-cols-2 gap-2">
              <FieldBlock label="Altura (cm)">
                <input
                  type="number"
                  required
                  min={100}
                  max={250}
                  step="0.1"
                  inputMode="decimal"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full bg-transparent text-base font-bold tabular-nums outline-none"
                />
              </FieldBlock>
              <FieldBlock label="Peso (kg)">
                <input
                  type="number"
                  required
                  min={30}
                  max={300}
                  step="0.1"
                  inputMode="decimal"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full bg-transparent text-base font-bold tabular-nums outline-none"
                />
              </FieldBlock>
            </div>
          </FormCard>

          <FormCard title="Modo de ritmo" emoji="🎚️" darkHeader>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["light", "Leve", "🍃"],
                  ["standard", "Padrão", "⚖️"],
                  ["firm", "Firme", "🔥"],
                ] as const
              ).map(([value, label, emoji]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRhythmMode(value)}
                  className={`rounded-2xl px-2 py-3 text-xs font-bold ${
                    rhythmMode === value
                      ? "bg-[var(--amber)] text-[var(--ink)]"
                      : "bg-white text-[var(--ink)]"
                  }`}
                >
                  <span className="mb-1 block text-base" aria-hidden>
                    {emoji}
                  </span>
                  {label}
                </button>
              ))}
            </div>
            <p className="px-1 text-[11px] text-[var(--muted)]">
              Controla streak/XP na UI — não muda calorias.
            </p>
          </FormCard>

          <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white/80">
            O placar do dia começa em zero. Passos e treinos entram em Mover.
          </div>

          {error ? (
            <p className="rounded-2xl bg-[var(--sand)] px-4 py-3 text-sm font-semibold text-[var(--crimson)]">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-[var(--teal)] px-4 py-3.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {loading ? "Salvando…" : "🚀 Começar no WELL"}
          </button>
        </form>
      </div>
    </div>
  );
}
