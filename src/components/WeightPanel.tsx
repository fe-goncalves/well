"use client";

import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export type WeightPoint = { logged_on: string; weight_kg: number };

export function WeightPanel({
  weights,
}: {
  weights: WeightPoint[];
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState(false);

  const chart = useMemo(() => {
    const pts = [...weights].sort((a, b) =>
      a.logged_on.localeCompare(b.logged_on),
    );
    if (pts.length === 0) return null;
    const vals = pts.map((p) => p.weight_kg);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = Math.max(0.5, max - min);
    const w = 300;
    const h = 150;
    const padX = 16;
    const padTop = 12;
    const padBottom = 28;
    const plotH = h - padTop - padBottom;
    const coords = pts.map((p, i) => {
      const x =
        padX +
        (pts.length === 1 ? (w - padX * 2) / 2 : (i / (pts.length - 1)) * (w - padX * 2));
      const y = padTop + ((max - p.weight_kg) / span) * plotH;
      return { x, y, ...p };
    });
    const path = coords
      .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
      .join(" ");
    return { coords, path, w, h, min, max, latest: pts[pts.length - 1], padBottom };
  }, [weights]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const kg = Number(value);
    if (!Number.isFinite(kg) || kg <= 0) {
      setSaving(false);
      setError("Peso inválido.");
      return;
    }
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setError("Sessão expirada");
      return;
    }
    const { error: upsertError } = await supabase.from("weight_logs").upsert(
      {
        user_id: user.id,
        weight_kg: kg,
        logged_on: date,
      },
      { onConflict: "user_id,logged_on" },
    );
    if (upsertError) {
      setSaving(false);
      setError(upsertError.message);
      return;
    }
    await supabase
      .from("profiles")
      .update({ weight_kg: kg, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    const { onWeightLogged } = await import("@/lib/gamification");
    await onWeightLogged(supabase, user.id, date);
    setSaving(false);
    setOpenForm(false);
    setValue("");
    router.refresh();
  }

  return (
    <section className="mt-5 overflow-hidden rounded-[1.5rem] bg-[var(--sand)]">
      <div className="flex items-center justify-between gap-2 bg-[var(--ink)] px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-bold text-white">
          <span aria-hidden>⚖️</span>
          Peso
        </p>
        <button
          type="button"
          onClick={() => setOpenForm((v) => !v)}
          className="rounded-full bg-[var(--mint)] px-3 py-1 text-xs font-bold text-[var(--ink)]"
        >
          {openForm ? "Fechar" : "+ Registrar"}
        </button>
      </div>
      <div className="p-3">
        {openForm ? (
          <form
            onSubmit={onSubmit}
            className="mb-3 space-y-2 rounded-2xl bg-white px-4 py-4 shadow-sm"
          >
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[10px] font-bold tracking-wide text-[var(--muted)] uppercase">
                Data
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-[var(--sand)]/50 px-3 py-2 text-sm font-bold outline-none"
                />
              </label>
              <label className="text-[10px] font-bold tracking-wide text-[var(--muted)] uppercase">
                Peso (kg)
                <input
                  type="number"
                  required
                  step="any"
                  min={30}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-[var(--sand)]/50 px-3 py-2 text-sm font-bold tabular-nums outline-none"
                />
              </label>
            </div>
            {error ? (
              <p className="text-xs font-semibold text-[var(--crimson)]">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-[var(--teal)] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? "Salvando…" : "Salvar peso"}
            </button>
          </form>
        ) : null}

        <div className="rounded-2xl bg-white px-3 py-4 shadow-sm">
          {!chart ? (
            <p className="py-8 text-center text-sm text-[var(--muted)]">
              Sem registros ainda. Adicione o primeiro peso.
            </p>
          ) : (
            <>
              <p className="mb-2 text-center text-[10px] font-bold tracking-[0.2em] text-[var(--muted)] uppercase">
                Evolução
              </p>
              <svg
                viewBox={`0 0 ${chart.w} ${chart.h}`}
                className="mx-auto h-auto w-full max-w-sm"
                role="img"
                aria-label="Gráfico de peso"
              >
                <path
                  d={chart.path}
                  fill="none"
                  stroke="#0A9396"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {chart.coords.map((c, i) => {
                  const showLabel =
                    chart.coords.length <= 8 ||
                    i === 0 ||
                    i === chart.coords.length - 1 ||
                    i % Math.ceil(chart.coords.length / 6) === 0;
                  return (
                    <g key={c.logged_on}>
                      <circle cx={c.x} cy={c.y} r="4" fill="#005F73" />
                      {showLabel ? (
                        <text
                          x={c.x}
                          y={chart.h - 8}
                          textAnchor="middle"
                          className="fill-[var(--muted)]"
                          style={{ fontSize: 9, fontWeight: 600 }}
                        >
                          {c.logged_on.slice(8)}/{c.logged_on.slice(5, 7)}
                        </text>
                      ) : null}
                    </g>
                  );
                })}
              </svg>
              <div className="mt-3 flex items-baseline justify-between px-2">
                <span className="text-xs text-[var(--muted)]">
                  {chart.min.toFixed(1)} – {chart.max.toFixed(1)} kg
                </span>
                <span className="text-lg font-extrabold tabular-nums">
                  {chart.latest.weight_kg.toFixed(1)}{" "}
                  <span className="text-xs font-bold text-[var(--muted)]">
                    kg
                  </span>
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
