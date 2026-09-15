"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  GOAL_TYPES,
  defaultGoalTitle,
  type GoalType,
} from "@/domain/goals";
import {
  suggestDailyCalorieCeiling,
  suggestPeriodDeficit,
} from "@/domain/suggestions";
import type { BiologicalSex } from "@/domain/tmb";
import {
  FieldBlock,
  FormCard,
  ScreenChrome,
} from "@/components/ScreenChrome";

function plusDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string) {
  const ms =
    new Date(b + "T12:00:00").getTime() - new Date(a + "T12:00:00").getTime();
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

const GOAL_EMOJI: Record<GoalType, string> = {
  weight_target: "⚖️",
  calorie_deficit: "📉",
  calorie_surplus: "📈",
  logging_habit: "📅",
  steps_target: "👟",
};

export default function NovoObjetivoPage() {
  const router = useRouter();
  const [goalType, setGoalType] = useState<GoalType>("calorie_deficit");
  const [targetValue, setTargetValue] = useState("8000");
  const [startDate, setStartDate] = useState(plusDays(0));
  const [endDate, setEndDate] = useState(plusDays(14));
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ceiling, setCeiling] = useState<number | null>(null);
  const [tmbNote, setTmbNote] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select(
          "biological_sex, birth_date, height_cm, weight_kg, tmb_override",
        )
        .eq("id", user.id)
        .single();
      if (!data) return;
      const suggestion = suggestDailyCalorieCeiling({
        biological_sex: data.biological_sex as BiologicalSex | null,
        birth_date: data.birth_date,
        height_cm: data.height_cm,
        weight_kg: data.weight_kg,
        tmb_override: data.tmb_override,
      });
      if (suggestion) {
        setCeiling(suggestion.ceiling);
        setTmbNote(suggestion.note);
      }
    })();
  }, []);

  const periodDays = daysBetween(startDate, endDate);
  const suggestedDeficit =
    ceiling != null ? suggestPeriodDeficit(ceiling, periodDays, 0.2) : null;

  const suggested = useMemo(
    () => defaultGoalTitle(goalType, Number(targetValue) || 0, endDate),
    [goalType, targetValue, endDate],
  );

  function applyCeilingSuggestion() {
    if (ceiling == null) return;
    if (goalType === "calorie_deficit" || goalType === "calorie_surplus") {
      setTargetValue(String(suggestedDeficit ?? ceiling * periodDays));
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const value = Number(targetValue);
    if (!Number.isFinite(value) || value <= 0) {
      setLoading(false);
      setError("Informe um valor alvo válido.");
      return;
    }
    if (endDate < startDate) {
      setLoading(false);
      setError("A data final precisa ser após o início.");
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

    const { error: insertError } = await supabase.from("goals").insert({
      user_id: user.id,
      goal_type: goalType,
      title: title.trim() || suggested,
      target_value: value,
      start_date: startDate,
      end_date: endDate,
      status: "active",
      meta: ceiling != null ? { suggested_daily_ceiling: ceiling } : {},
    });

    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    const { onGoalCreated } = await import("@/lib/gamification");
    const result = await onGoalCreated(supabase, user.id);
    const { feedbackQuery } = await import("@/lib/feedback");
    router.push(`/jornada${feedbackQuery(result)}`);
    router.refresh();
  }

  return (
    <ScreenChrome
      bg="#0A9396"
      heroBg="#005F73"
      backHref="/jornada"
      backLabel="Jornada"
      eyebrow="🎯 Objetivo"
      title="Criar objetivo"
      subtitle="Sem IA no progresso. A TMB só sugere um teto de referência."
    >
      {ceiling != null ? (
        <FormCard title="Sugestão TMB" emoji="💡" darkHeader>
          <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
            <p className="text-sm font-bold text-[var(--ink)]">
              Teto diário ≈ {ceiling} kcal
            </p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">{tmbNote}</p>
            {(goalType === "calorie_deficit" ||
              goalType === "calorie_surplus") &&
            suggestedDeficit != null ? (
              <button
                type="button"
                onClick={applyCeilingSuggestion}
                className="mt-3 rounded-2xl bg-[var(--teal)] px-3 py-2 text-xs font-bold text-white"
              >
                Usar ~{suggestedDeficit} kcal no período (−20%/dia ×{" "}
                {periodDays}d)
              </button>
            ) : null}
          </div>
        </FormCard>
      ) : null}

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <FormCard title="Tipo" emoji="🗂️" darkHeader>
          <div className="space-y-2">
            {GOAL_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setGoalType(t.id);
                  if (t.id === "logging_habit") setTargetValue("5");
                  if (t.id === "weight_target") setTargetValue("75");
                  if (t.id === "steps_target") setTargetValue("70000");
                  if (
                    t.id === "calorie_deficit" ||
                    t.id === "calorie_surplus"
                  ) {
                    setTargetValue(
                      String(
                        suggestedDeficit ??
                          (ceiling != null ? ceiling * 14 : 8000),
                      ),
                    );
                  }
                }}
                className={`w-full rounded-2xl px-4 py-3 text-left ${
                  goalType === t.id
                    ? "bg-[var(--teal)] text-white"
                    : "bg-white text-[var(--ink)]"
                }`}
              >
                <span className="block text-sm font-bold">
                  <span className="mr-1" aria-hidden>
                    {GOAL_EMOJI[t.id]}
                  </span>
                  {t.label}
                </span>
                <span
                  className={`mt-1 block text-xs ${
                    goalType === t.id ? "text-white/80" : "text-[var(--muted)]"
                  }`}
                >
                  {t.hint}
                </span>
              </button>
            ))}
          </div>
        </FormCard>

        <FormCard title="Detalhes" emoji="📝">
          <FieldBlock
            label={
              goalType === "weight_target"
                ? "Peso alvo (kg)"
                : goalType === "logging_habit"
                  ? "Quantidade de dias"
                  : goalType === "steps_target"
                    ? "Passos no período"
                    : "kcal no período"
            }
          >
            <input
              type="number"
              required
              min={1}
              step={goalType === "weight_target" ? "any" : 1}
              inputMode={goalType === "weight_target" ? "decimal" : "numeric"}
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              className="w-full bg-transparent text-base font-bold tabular-nums outline-none"
            />
          </FieldBlock>
          <div className="grid grid-cols-2 gap-2">
            <FieldBlock label="Início">
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-transparent text-sm font-bold outline-none"
              />
            </FieldBlock>
            <FieldBlock label="Fim">
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-transparent text-sm font-bold outline-none"
              />
            </FieldBlock>
          </div>
          <FieldBlock label="Título (opcional)">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={suggested}
              className="w-full bg-transparent text-base font-bold outline-none placeholder:font-medium placeholder:text-[var(--muted)]"
            />
          </FieldBlock>
          <div className="rounded-2xl bg-[var(--ink)] px-4 py-3 text-sm font-semibold text-[var(--mint)]">
            {title.trim() || suggested}
          </div>
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
          {loading ? "Salvando…" : "🎯 Criar objetivo"}
        </button>
      </form>
    </ScreenChrome>
  );
}
