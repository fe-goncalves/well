"use client";

import Link from "next/link";
import { useState } from "react";

export type HojeGoalItem = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
};

export function HojeHeaderActions({
  goals,
}: {
  goals: HojeGoalItem[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <Link
          href="/hoje/diario"
          className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold text-white"
          aria-label="Diário"
        >
          <span aria-hidden>📔</span>
          Diário
        </Link>
        {goals.length > 0 ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold text-white"
          >
            <span aria-hidden>🎯</span>
            Objetivos
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-3 sm:items-center"
          role="dialog"
          aria-modal
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-[1.5rem] bg-[var(--sand)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between bg-[var(--ink)] px-4 py-3 text-white">
              <p className="text-sm font-bold">🎯 Objetivos ativos hoje</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold"
              >
                Fechar
              </button>
            </div>
            <ul className="max-h-[60vh] overflow-y-auto p-3">
              {goals.map((g) => (
                <li
                  key={g.id}
                  className="mb-2 rounded-2xl bg-white px-4 py-3 shadow-sm last:mb-0"
                >
                  <p className="text-sm font-bold text-[var(--ink)]">{g.title}</p>
                  <p className="mt-1 text-[11px] text-[var(--muted)]">
                    {g.start_date} → {g.end_date}
                  </p>
                </li>
              ))}
            </ul>
            <div className="border-t border-[var(--line)] p-3">
              <Link
                href="/jornada"
                className="block w-full rounded-2xl bg-[var(--teal)] px-4 py-3 text-center text-sm font-bold text-white"
                onClick={() => setOpen(false)}
              >
                Ver na Jornada
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
