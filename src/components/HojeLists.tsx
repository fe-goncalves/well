"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { MealSlot } from "@/domain";
import { MEAL_SLOTS } from "@/domain/meals";
import { activityTypeById } from "@/domain/activity-types";
import { createClient } from "@/lib/supabase/client";

export type FoodRow = {
  id: string;
  label: string;
  calories: number;
  meal_slot: MealSlot | string;
};

export type ActivityRow = {
  id: string;
  description: string;
  calories_burned: number;
  category?: string;
  activity_type?: string | null;
  duration_minutes?: number | null;
};

const MEAL_EMOJI: Record<string, string> = {
  breakfast: "🥐",
  lunch: "🍽️",
  afternoon_snack: "🍎",
  dinner: "🍲",
  supper: "🌙",
};

function ReceiptLine({
  href,
  label,
  value,
  valueClass,
}: {
  href?: string;
  label: string;
  value: string;
  valueClass?: string;
}) {
  const inner = (
    <>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span
        className={`shrink-0 tabular-nums font-semibold ${valueClass ?? ""}`}
      >
        {value}
      </span>
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="flex items-baseline justify-between gap-3 py-1.5 text-sm text-[var(--ink)] hover:bg-black/[0.03]"
      >
        {inner}
      </Link>
    );
  }
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-sm text-[var(--ink)]">
      {inner}
    </div>
  );
}

function ReceiptDivider() {
  return (
    <div
      className="my-2 border-t border-dashed border-[var(--ink)]/20"
      aria-hidden
    />
  );
}

export function HojeLists({
  foods,
  activities,
  stepsToday,
}: {
  foods: FoodRow[];
  activities: ActivityRow[];
  stepsToday: number;
}) {
  const [tab, setTab] = useState<"food" | "activity">("food");
  const [steps, setSteps] = useState(String(stepsToday || ""));
  const [stepsMsg, setStepsMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const foodsBySlot = useMemo(() => {
    const map = new Map<string, FoodRow[]>();
    for (const slot of MEAL_SLOTS) map.set(slot.id, []);
    for (const f of foods) {
      const key = MEAL_SLOTS.some((s) => s.id === f.meal_slot)
        ? f.meal_slot
        : "lunch";
      const list = map.get(key) ?? [];
      list.push(f);
      map.set(key, list);
    }
    return map;
  }, [foods]);

  const foodTotal = foods.reduce((s, f) => s + f.calories, 0);
  const activityTotal = activities.reduce((s, a) => s + a.calories_burned, 0);
  const slotsWithItems = MEAL_SLOTS.filter(
    (slot) => (foodsBySlot.get(slot.id) ?? []).length > 0,
  );

  function saveSteps() {
    const value = Math.round(Number(steps));
    if (!Number.isFinite(value) || value < 0) {
      setStepsMsg("Informe um número válido.");
      return;
    }
    startTransition(async () => {
      setStepsMsg(null);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setStepsMsg("Sessão expirada");
        return;
      }
      const today = new Date().toISOString().slice(0, 10);
      const { error } = await supabase.from("step_logs").upsert(
        {
          user_id: user.id,
          logged_on: today,
          steps: value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,logged_on" },
      );
      setStepsMsg(error ? error.message : "Passos salvos.");
    });
  }

  return (
    <section className="mt-5 overflow-hidden rounded-[1.5rem] bg-[var(--sand)]">
      <div className="bg-[var(--ink)] p-1.5">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setTab("food")}
            className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
              tab === "food"
                ? "bg-[var(--mint)] text-[var(--ink)]"
                : "bg-transparent text-white/65"
            }`}
          >
            <span aria-hidden>🥗</span>
            Alimentação
          </button>
          <button
            type="button"
            onClick={() => setTab("activity")}
            className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
              tab === "activity"
                ? "bg-[var(--amber)] text-[var(--ink)]"
                : "bg-transparent text-white/65"
            }`}
          >
            <span aria-hidden>💪</span>
            Atividades
          </button>
        </div>
      </div>

      {tab === "food" ? (
        <div className="p-3">
          <Link
            href="/hoje/comer"
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--teal)] px-4 py-3.5 text-sm font-bold text-white"
          >
            <span aria-hidden>➕</span>
            Adicionar refeição
          </Link>
          <div className="rounded-2xl bg-white px-4 py-4 font-sans shadow-sm">
            <p className="text-center text-[10px] font-bold tracking-[0.2em] text-[var(--muted)] uppercase">
              Nota do dia · alimentação
            </p>
            {slotsWithItems.length === 0 ? (
              <p className="mt-6 mb-2 text-center text-sm text-[var(--muted)]">
                Sem itens ainda.
              </p>
            ) : (
              <div className="mt-4">
                {slotsWithItems.map((slot, idx) => {
                  const items = foodsBySlot.get(slot.id) ?? [];
                  const sub = items.reduce((s, i) => s + i.calories, 0);
                  return (
                    <div key={slot.id}>
                      {idx > 0 ? <ReceiptDivider /> : null}
                      <p className="mb-1 flex items-center gap-1.5 text-xs font-bold tracking-wide text-[var(--muted)] uppercase">
                        <span aria-hidden>{MEAL_EMOJI[slot.id] ?? "🍽️"}</span>
                        {slot.label}
                      </p>
                      {items.map((f) => (
                        <ReceiptLine
                          key={f.id}
                          href={`/hoje/comer/${f.id}`}
                          label={f.label}
                          value={`${f.calories}`}
                          valueClass="text-[var(--teal)]"
                        />
                      ))}
                      <p className="mt-0.5 text-right text-[11px] font-semibold text-[var(--muted)]">
                        subtotal {sub}
                      </p>
                    </div>
                  );
                })}
                <div className="mt-3 border-t-2 border-[var(--ink)] pt-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-extrabold uppercase tracking-wide">
                      Total
                    </span>
                    <span className="text-lg font-extrabold tabular-nums text-[var(--teal)]">
                      {foodTotal}{" "}
                      <span className="text-xs font-bold">kcal</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-3">
          <Link
            href="/hoje/mover"
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--amber)] px-4 py-3.5 text-sm font-bold text-[var(--ink)]"
          >
            <span aria-hidden>➕</span>
            Adicionar atividade
          </Link>

          <div className="rounded-2xl bg-white px-4 py-4 font-sans shadow-sm">
            <p className="text-center text-[10px] font-bold tracking-[0.2em] text-[var(--muted)] uppercase">
              Nota do dia · atividades
            </p>
            <div className="mt-4">
              {activities.map((a, idx) => {
                const type = activityTypeById(a.activity_type ?? a.category);
                const label =
                  a.description || type?.label || "Atividade";
                const meta = [
                  type?.emoji,
                  a.duration_minutes != null
                    ? `${a.duration_minutes} min`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <div key={a.id}>
                    {idx > 0 ? <ReceiptDivider /> : null}
                    <ReceiptLine
                      href={`/hoje/mover/${a.id}`}
                      label={meta ? `${meta} ${label}` : label}
                      value={`${a.calories_burned}`}
                      valueClass="text-[var(--orange)]"
                    />
                  </div>
                );
              })}

              {activities.length > 0 ? <ReceiptDivider /> : null}

              {/* Passos — item da lista, acima do total kcal */}
              <div className="py-1.5">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold tracking-wide text-[var(--muted)] uppercase">
                  <span aria-hidden>👟</span>
                  Passos
                </p>
                <p className="mb-2 text-[11px] text-[var(--muted)]">
                  À parte do saldo de kcal
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={steps}
                    onChange={(e) => setSteps(e.target.value)}
                    placeholder="0"
                    className="min-w-0 flex-1 rounded-xl bg-[var(--sand)]/70 px-3 py-2 text-base font-extrabold tabular-nums outline-none"
                  />
                  <button
                    type="button"
                    onClick={saveSteps}
                    disabled={pending}
                    className="shrink-0 rounded-xl bg-[var(--ink)] px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                  >
                    {pending ? "…" : "Salvar"}
                  </button>
                </div>
                {stepsMsg ? (
                  <p className="mt-1.5 text-xs font-semibold text-[var(--deep)]">
                    {stepsMsg}
                  </p>
                ) : null}
              </div>

              <div className="mt-3 border-t-2 border-[var(--ink)] pt-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-extrabold uppercase tracking-wide">
                    Total kcal
                  </span>
                  <span className="text-lg font-extrabold tabular-nums text-[var(--orange)]">
                    {activityTotal}{" "}
                    <span className="text-xs font-bold">kcal</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
