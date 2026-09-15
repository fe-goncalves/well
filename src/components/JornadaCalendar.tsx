"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  JornadaDayModal,
  type DayDetail,
} from "@/components/JornadaDayModal";

const WEEKDAYS = ["S", "T", "Q", "Q", "S", "S", "D"];

type DayInfo = {
  balance: number;
  hasRecord: boolean;
  inStreak: boolean;
  usedFreeze: boolean;
  goalIds: string[];
  steps: number;
};

function formatSteps(n: number) {
  if (n <= 0) return null;
  if (n >= 1000) return `${Math.round(n / 100) / 10}k`;
  return String(n);
}

export function JornadaCalendar({
  periodo,
  today,
  monthLabel,
  matrix,
  weekDays,
  byDate,
  dayDetails,
}: {
  periodo: "mes" | "semana";
  today: string;
  monthLabel: string;
  matrix: (string | null)[][] | null;
  weekDays: string[];
  byDate: Record<string, DayInfo>;
  dayDetails: Record<string, DayDetail>;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const emptyDetail = useMemo(
    () =>
      selected
        ? {
            date: selected,
            foods: dayDetails[selected]?.foods ?? [],
            activities: dayDetails[selected]?.activities ?? [],
            steps: dayDetails[selected]?.steps ?? 0,
            journal: dayDetails[selected]?.journal ?? null,
            goals: dayDetails[selected]?.goals ?? [],
          }
        : null,
    [selected, dayDetails],
  );

  function cellTone(date: string) {
    const info = byDate[date];
    const isFuture = date > today;
    const isToday = date === today;
    const recorded = Boolean(info?.hasRecord) && !isFuture;
    const bal = info?.balance ?? 0;
    let tone = "bg-[var(--sand)]/50 text-[var(--muted)]";
    if (isFuture) tone = "bg-transparent text-[var(--muted)]/35";
    else if (recorded && bal > 0)
      tone = "bg-[var(--coral)]/20 text-[var(--crimson)]";
    else if (recorded && bal < 0)
      tone = "bg-[var(--mint)] text-[var(--deep)]";
    else if (recorded) tone = "bg-[var(--teal)]/15 text-[var(--deep)]";
    else if (isToday) tone = "bg-[var(--amber)]/35 text-[var(--ink)]";
    return { tone, isToday, recorded, bal, info };
  }

  function CellContent({ date }: { date: string }) {
    const { recorded, bal, info } = cellTone(date);
    const stepsLabel = formatSteps(info?.steps ?? 0);
    return (
      <>
        <span className="flex items-center justify-center gap-0.5 leading-none">
          {info?.inStreak ? (
            <span aria-hidden>🔥</span>
          ) : info?.usedFreeze ? (
            <span aria-hidden>🧊</span>
          ) : null}
          <span>{date.slice(8)}</span>
          {(info?.goalIds?.length ?? 0) > 0 ? (
            <span aria-hidden>🎯</span>
          ) : null}
        </span>
        {recorded ? (
          <span className="text-[8px] font-bold leading-none">
            {bal > 0 ? "+" : ""}
            {Math.round(bal)}
          </span>
        ) : null}
        {stepsLabel ? (
          <span className="text-[7px] font-semibold leading-none text-[var(--deep)]">
            👟{stepsLabel}
          </span>
        ) : null}
      </>
    );
  }

  return (
    <>
      <section className="mt-5 overflow-hidden rounded-[1.5rem] bg-[var(--sand)]">
        <div className="bg-[var(--ink)] p-1.5">
          <div className="grid grid-cols-2 gap-1">
            <Link
              href="/jornada?periodo=semana"
              className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold ${
                periodo === "semana"
                  ? "bg-[var(--amber)] text-[var(--ink)]"
                  : "text-white/65"
              }`}
            >
              <span aria-hidden>🗓️</span>
              Semanal
            </Link>
            <Link
              href="/jornada?periodo=mes"
              className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold ${
                periodo === "mes"
                  ? "bg-[var(--mint)] text-[var(--ink)]"
                  : "text-white/65"
              }`}
            >
              <span aria-hidden>📅</span>
              Mensal
            </Link>
          </div>
        </div>

        <div className="p-3">
          <div className="rounded-2xl bg-white px-3 py-4 shadow-sm">
            <p className="mb-3 text-center text-[10px] font-bold tracking-[0.2em] text-[var(--muted)] uppercase">
              {periodo === "mes" ? monthLabel : "Semana corrente"}
            </p>

            {periodo === "mes" && matrix ? (
              <>
                <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold tracking-wide text-[var(--muted)]">
                  {WEEKDAYS.map((d, i) => (
                    <span key={`${d}-${i}`}>{d}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {matrix.flat().map((date, idx) => {
                    if (!date) {
                      return <div key={`e-${idx}`} className="aspect-square" />;
                    }
                    const { tone, isToday } = cellTone(date);
                    return (
                      <button
                        type="button"
                        key={date}
                        onClick={() => setSelected(date)}
                        className={`flex min-h-[3.1rem] flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1 text-[11px] font-semibold ${tone} ${
                          isToday ? "ring-2 ring-[var(--ink)]" : ""
                        }`}
                      >
                        <CellContent date={date} />
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="grid grid-cols-7 gap-1.5">
                {weekDays.map((date, i) => {
                  const { tone, isToday } = cellTone(date);
                  return (
                    <button
                      type="button"
                      key={date}
                      onClick={() => setSelected(date)}
                      className={`rounded-xl px-0.5 py-2 text-center ${tone} ${
                        isToday ? "ring-2 ring-[var(--ink)]" : ""
                      }`}
                    >
                      <p className="text-[10px] font-semibold text-[var(--muted)]">
                        {WEEKDAYS[i]}
                      </p>
                      <div className="mt-1 flex flex-col items-center gap-0.5 text-sm font-bold">
                        <CellContent date={date} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <p className="mt-3 text-center text-[11px] text-[var(--muted)]">
              Toque · 🔥 streak · 🧊 freeze · 🎯 objetivo · 👟 passos
            </p>
          </div>
        </div>
      </section>

      {emptyDetail ? (
        <JornadaDayModal
          detail={emptyDetail}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </>
  );
}
