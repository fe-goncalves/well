"use client";

import { useState } from "react";
import type { GoalProgress, GoalRow } from "@/domain/goals";

export type GoalCardData = {
  goal: GoalRow;
  progress: GoalProgress;
  pct: number;
};

export function GoalsSection({
  items,
}: {
  items: GoalCardData[];
}) {
  const [selected, setSelected] = useState<GoalCardData | null>(null);

  return (
    <>
      <section className="mt-5 overflow-hidden rounded-[1.5rem] bg-[var(--sand)]">
        <div className="flex items-center justify-between gap-2 bg-[var(--ink)] px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-bold text-white">
            <span aria-hidden>🎯</span>
            Objetivos
          </p>
          <a
            href="/jornada/novo"
            className="rounded-full bg-[var(--mint)] px-3 py-1 text-xs font-bold text-[var(--ink)]"
          >
            + Novo
          </a>
        </div>
        <div className="p-3">
          {items.length === 0 ? (
            <div className="rounded-2xl bg-white px-4 py-6 text-center shadow-sm">
              <p className="text-sm font-bold">Nenhum objetivo ativo</p>
              <a
                href="/jornada/novo"
                className="mt-4 inline-flex rounded-2xl bg-[var(--teal)] px-4 py-2.5 text-sm font-bold text-white"
              >
                Criar agora
              </a>
            </div>
          ) : (
            <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
              <ul>
                {items.map((item, i) => (
                  <li key={item.goal.id}>
                    {i > 0 ? (
                      <div
                        className="my-3 border-t border-dashed border-[var(--ink)]/20"
                        aria-hidden
                      />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold">{item.goal.title}</p>
                          <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                            {item.goal.start_date} → {item.goal.end_date}
                          </p>
                          <p className="mt-1 text-xs font-medium text-[var(--deep)]">
                            {item.progress.label}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-extrabold tabular-nums text-[var(--teal)]">
                          {item.pct}%
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--sand)]">
                        <div
                          className="h-full rounded-full bg-[var(--ink)]"
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {selected ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-3 sm:items-center"
          role="dialog"
          aria-modal
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-[1.5rem] bg-[var(--sand)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between bg-[var(--ink)] px-4 py-3 text-white">
              <p className="text-sm font-bold">🎯 Panorama do objetivo</p>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold"
              >
                Fechar
              </button>
            </div>
            <div className="space-y-3 p-4">
              <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
                <p className="text-lg font-extrabold text-[var(--ink)]">
                  {selected.goal.title}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {selected.goal.start_date} → {selected.goal.end_date}
                </p>
                <p className="mt-3 text-sm font-semibold text-[var(--deep)]">
                  {selected.progress.label}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {selected.progress.detail}
                </p>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[var(--sand)]">
                  <div
                    className="h-full rounded-full bg-[var(--teal)]"
                    style={{ width: `${selected.pct}%` }}
                  />
                </div>
                <p className="mt-2 text-right text-sm font-extrabold tabular-nums text-[var(--teal)]">
                  {selected.pct}%
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <dt className="text-[10px] font-bold tracking-wide text-[var(--muted)] uppercase">
                    Atual
                  </dt>
                  <dd className="mt-1 text-lg font-extrabold tabular-nums">
                    {Math.round(selected.progress.current * 10) / 10}
                  </dd>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <dt className="text-[10px] font-bold tracking-wide text-[var(--muted)] uppercase">
                    Alvo
                  </dt>
                  <dd className="mt-1 text-lg font-extrabold tabular-nums">
                    {Math.round(selected.progress.target * 10) / 10}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
