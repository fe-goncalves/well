"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { activityTypeById } from "@/domain/activity-types";
import { mealSlotLabel } from "@/domain/meals";

export type DayDetail = {
  date: string;
  foods: {
    id: string;
    label: string;
    calories: number;
    meal_slot: string;
  }[];
  activities: {
    id: string;
    description: string;
    calories_burned: number;
    activity_type?: string | null;
    duration_minutes?: number | null;
  }[];
  steps: number;
  journal: { body: string; hasPhoto: boolean } | null;
  goals: { id: string; title: string }[];
};

function Accordion({
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold tracking-wide text-[var(--muted)] uppercase">
            {title}
          </span>
          {summary ? (
            <span className="mt-0.5 block text-sm font-semibold text-[var(--ink)]">
              {summary}
            </span>
          ) : null}
        </span>
        <span className="text-sm font-bold text-[var(--muted)]" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>
      {open ? <div className="border-t border-[var(--line)] px-4 pb-3">{children}</div> : null}
    </div>
  );
}

export function JornadaDayModal({
  detail,
  onClose,
}: {
  detail: DayDetail;
  onClose: () => void;
}) {
  const foodTotal = detail.foods.reduce((s, f) => s + f.calories, 0);
  const actTotal = detail.activities.reduce(
    (s, a) => s + a.calories_burned,
    0,
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-3 sm:items-center"
      role="dialog"
      aria-modal
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[1.5rem] bg-[var(--sand)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-[var(--ink)] px-4 py-3 text-white">
          <div>
            <p className="text-xs font-bold tracking-wide text-white/60 uppercase">
              Dia
            </p>
            <p className="text-sm font-bold">
              {new Date(detail.date + "T12:00:00").toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "short",
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold"
          >
            Fechar
          </button>
        </div>

        <div className="space-y-2 p-3">
          {detail.goals.length > 0 ? (
            <Accordion
              title="🎯 Objetivos neste dia"
              summary={`${detail.goals.length} ativo${detail.goals.length === 1 ? "" : "s"}`}
            >
              <ul className="mt-2 space-y-1">
                {detail.goals.map((g) => (
                  <li key={g.id} className="text-sm font-semibold">
                    {g.title}
                  </li>
                ))}
              </ul>
            </Accordion>
          ) : null}

          <Accordion
            title="👟 Passos"
            summary={detail.steps ? `${detail.steps.toLocaleString("pt-BR")}` : "—"}
            defaultOpen
          >
            <p className="mt-2 text-2xl font-extrabold tabular-nums">
              {detail.steps || "—"}
            </p>
          </Accordion>

          <Accordion
            title="🥗 Alimentação"
            summary={`${detail.foods.length} item${detail.foods.length === 1 ? "" : "s"} · ${foodTotal} kcal`}
          >
            {detail.foods.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--muted)]">Nada registrado.</p>
            ) : (
              <ul className="mt-2">
                {detail.foods.map((f) => (
                  <li key={f.id}>
                    <Link
                      href={`/hoje/comer/${f.id}`}
                      className="flex justify-between gap-2 border-t border-dashed border-[var(--ink)]/10 py-2 text-sm first:border-0"
                    >
                      <span className="min-w-0 truncate font-medium">
                        {f.label}
                        <span className="ml-1 text-[10px] text-[var(--muted)]">
                          {mealSlotLabel(f.meal_slot)}
                        </span>
                      </span>
                      <span className="font-bold text-[var(--teal)]">
                        {f.calories}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Accordion>

          <Accordion
            title="💪 Atividades"
            summary={`${detail.activities.length} · ${actTotal} kcal`}
          >
            {detail.activities.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--muted)]">Nada registrado.</p>
            ) : (
              <ul className="mt-2">
                {detail.activities.map((a) => {
                  const t = activityTypeById(a.activity_type);
                  return (
                    <li key={a.id}>
                      <Link
                        href={`/hoje/mover/${a.id}`}
                        className="flex justify-between gap-2 border-t border-dashed border-[var(--ink)]/10 py-2 text-sm first:border-0"
                      >
                        <span className="min-w-0 truncate font-medium">
                          {t?.emoji} {a.description}
                          {a.duration_minutes != null
                            ? ` · ${a.duration_minutes}min`
                            : ""}
                        </span>
                        <span className="font-bold text-[var(--orange)]">
                          {a.calories_burned}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Accordion>

          <Accordion
            title="📔 Diário"
            summary={
              detail.journal
                ? detail.journal.hasPhoto
                  ? "Com texto/foto"
                  : "Com entrada"
                : "Sem entrada"
            }
          >
            {detail.journal ? (
              <div className="mt-2">
                <p className="text-sm whitespace-pre-wrap">
                  {detail.journal.body || "(sem texto)"}
                </p>
                {detail.journal.hasPhoto ? (
                  <p className="mt-1 text-xs text-[var(--muted)]">📷 Com foto</p>
                ) : null}
                <Link
                  href="/hoje/diario"
                  className="mt-2 inline-block text-xs font-bold text-[var(--deep)]"
                >
                  Abrir diário →
                </Link>
              </div>
            ) : (
              <p className="mt-2 text-sm text-[var(--muted)]">Sem entrada.</p>
            )}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
