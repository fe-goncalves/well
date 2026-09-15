"use client";

import { useMemo, useState } from "react";
import { useAppNav } from "@/components/NavigationProvider";
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
  const { navigate } = useAppNav();
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

  function CellMarks({ date, compact }: { date: string; compact?: boolean }) {
    const { recorded, bal, info } = cellTone(date);
    const stepsLabel = formatSteps(info?.steps ?? 0);
    const marks: string[] = [];
    if (info?.inStreak) marks.push("🔥");
    else if (info?.usedFreeze) marks.push("🧊");
    if ((info?.goalIds?.length ?? 0) > 0) marks.push("🎯");
    if (stepsLabel) marks.push("👟");

    return (
      <div className="flex w-full flex-col items-center gap-0.5 overflow-hidden">
        <span
          className={`font-extrabold tabular-nums leading-none ${
            compact ? "text-[11px]" : "text-sm"
          }`}
        >
          {date.slice(8)}
        </span>
        {marks.length > 0 ? (
          <span
            className={`flex max-w-full flex-wrap items-center justify-center gap-x-0.5 leading-none ${
              compact ? "text-[9px]" : "text-[11px]"
            }`}
          >
            {marks.map((m) => (
              <span key={m} aria-hidden>
                {m}
              </span>
            ))}
          </span>
        ) : (
          <span className={`leading-none ${compact ? "h-[9px]" : "h-[11px]"}`} />
        )}
        {recorded ? (
          <span
            className={`font-bold tabular-nums leading-none ${
              compact ? "text-[8px]" : "text-[10px]"
            }`}
          >
            {bal > 0 ? "+" : ""}
            {Math.round(bal)}
          </span>
        ) : stepsLabel && !compact ? (
          <span className="text-[9px] font-semibold leading-none text-[var(--deep)]">
            {stepsLabel}
          </span>
        ) : (
          <span className={`leading-none ${compact ? "h-2" : "h-2.5"}`} />
        )}
      </div>
    );
  }

  return (
    <>
      <section className="mt-5 overflow-hidden rounded-[1.5rem] bg-[var(--sand)]">
        <div className="bg-[var(--ink)] p-1.5">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => navigate("/jornada?periodo=semana")}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold ${
                periodo === "semana"
                  ? "bg-[var(--amber)] text-[var(--ink)]"
                  : "text-white/65"
              }`}
            >
              <span aria-hidden>🗓️</span>
              Semanal
            </button>
            <button
              type="button"
              onClick={() => navigate("/jornada?periodo=mes")}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold ${
                periodo === "mes"
                  ? "bg-[var(--mint)] text-[var(--ink)]"
                  : "text-white/65"
              }`}
            >
              <span aria-hidden>📅</span>
              Mensal
            </button>
          </div>
        </div>

        <div className="p-3">
          <div className="rounded-2xl bg-white px-2 py-4 shadow-sm sm:px-3">
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
                <div className="grid grid-cols-7 gap-1.5">
                  {matrix.flat().map((date, idx) => {
                    if (!date) {
                      return (
                        <div key={`e-${idx}`} className="min-h-[4.25rem]" />
                      );
                    }
                    const { tone, isToday } = cellTone(date);
                    return (
                      <button
                        type="button"
                        key={date}
                        onClick={() => setSelected(date)}
                        className={`flex min-h-[4.25rem] flex-col items-center justify-center rounded-xl px-0.5 py-1.5 ${tone} ${
                          isToday ? "ring-2 ring-[var(--ink)]" : ""
                        }`}
                      >
                        <CellMarks date={date} compact />
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {weekDays.map((date, i) => {
                  const { tone, isToday } = cellTone(date);
                  return (
                    <button
                      type="button"
                      key={date}
                      onClick={() => setSelected(date)}
                      className={`flex w-[4.6rem] shrink-0 flex-col items-center rounded-2xl px-1.5 py-3 ${tone} ${
                        isToday ? "ring-2 ring-[var(--ink)]" : ""
                      }`}
                    >
                      <p className="text-[10px] font-bold tracking-wide text-[var(--muted)] uppercase">
                        {WEEKDAYS[i]}
                      </p>
                      <div className="mt-2 w-full">
                        <CellMarks date={date} />
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
