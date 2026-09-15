"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ACTIVITY_TYPES,
  searchActivityTypes,
} from "@/domain/activity-types";
import {
  FieldBlock,
  FormCard,
  ScreenChrome,
} from "@/components/ScreenChrome";

export default function MoverPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activityType, setActivityType] = useState("walking");
  const [description, setDescription] = useState("");
  const [calories, setCalories] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => searchActivityTypes(query), [query]);
  const selected = ACTIVITY_TYPES.find((t) => t.id === activityType);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const burned = Math.round(Number(calories));
    if (!Number.isFinite(burned) || burned < 0) {
      setLoading(false);
      setError("Informe as calorias gastas.");
      return;
    }
    const mins =
      duration.trim() === "" ? null : Math.round(Number(duration));
    if (mins != null && (!Number.isFinite(mins) || mins < 0)) {
      setLoading(false);
      setError("Tempo inválido.");
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setError("Sessão expirada");
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const type = ACTIVITY_TYPES.find((t) => t.id === activityType);
    const label =
      description.trim() || type?.label || "Atividade";

    const { error: insertError } = await supabase.from("activity_entries").insert({
      user_id: user.id,
      logged_on: today,
      category: type?.group ?? "other",
      activity_type: activityType,
      description: label,
      calories_burned: burned,
      duration_minutes: mins,
      notes: notes.trim(),
      steps: null,
    });

    if (insertError) {
      setLoading(false);
      setError(insertError.message);
      return;
    }

    const { onActivityLogged } = await import("@/lib/gamification");
    const result = await onActivityLogged(supabase, user.id, today);
    const { feedbackQuery } = await import("@/lib/feedback");

    setLoading(false);
    router.push(`/hoje${feedbackQuery(result)}`);
    router.refresh();
  }

  return (
    <ScreenChrome
      bg="#EE9B00"
      heroBg="#CA6702"
      backHref="/hoje"
      backLabel="Hoje"
      eyebrow="💪 Atividades"
      title="O que você fez?"
      subtitle="Escolha o tipo, tempo e kcal. Passos ficam na home, à parte."
      logoWhite
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <FormCard title="Tipo de atividade" emoji="🔎" darkHeader>
          <FieldBlock label="Pesquisar">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex.: corrida, yoga, futebol…"
              className="w-full bg-transparent text-base font-bold outline-none placeholder:font-medium placeholder:text-[var(--muted)]"
            />
          </FieldBlock>
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-2xl bg-white p-2 shadow-sm">
            {filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActivityType(t.id)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold ${
                  activityType === t.id
                    ? "bg-[var(--amber)] text-[var(--ink)]"
                    : "hover:bg-[var(--sand)]/60"
                }`}
              >
                <span aria-hidden>{t.emoji}</span>
                {t.label}
              </button>
            ))}
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-[var(--muted)]">
                Nenhum tipo encontrado.
              </p>
            ) : null}
          </div>
          {selected ? (
            <p className="px-1 text-xs font-semibold text-[var(--muted)]">
              Selecionado: {selected.emoji} {selected.label}
            </p>
          ) : null}
        </FormCard>

        <FormCard title="Detalhes" emoji="📝">
          <FieldBlock label="Título / descrição">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={selected?.label ?? "Ex.: treino de pernas"}
              className="w-full bg-transparent text-base font-bold outline-none placeholder:font-medium placeholder:text-[var(--muted)]"
            />
          </FieldBlock>
          <div className="grid grid-cols-2 gap-2">
            <FieldBlock label="Tempo (min)">
              <input
                type="number"
                min={0}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent text-base font-bold tabular-nums outline-none"
              />
            </FieldBlock>
            <FieldBlock label="kcal gastas">
              <input
                type="number"
                required
                min={0}
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="w-full bg-transparent text-base font-bold tabular-nums outline-none"
              />
            </FieldBlock>
          </div>
          <FieldBlock label="Anotações">
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Como foi, intensidade, contexto…"
              className="w-full resize-none bg-transparent text-sm font-medium outline-none placeholder:text-[var(--muted)]"
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
          {loading ? "Salvando…" : "⚡ Somar ao gasto"}
        </button>
      </form>
    </ScreenChrome>
  );
}
