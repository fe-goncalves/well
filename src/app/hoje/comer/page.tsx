"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { FoodEstimateItem, MealSlot } from "@/domain";
import { MEAL_SLOTS } from "@/domain/meals";
import {
  FieldBlock,
  FormCard,
  ScreenChrome,
} from "@/components/ScreenChrome";
import {
  deleteSavedFood,
  importSavedFoodToDay,
  listSavedFoods,
  upsertSavedFood,
  type SavedFood,
} from "@/lib/food-saved";

type DraftItem = FoodEstimateItem & { rawText: string };

const MEAL_EMOJI: Record<string, string> = {
  breakfast: "🥐",
  lunch: "🍽️",
  afternoon_snack: "🍎",
  dinner: "🍲",
  supper: "🌙",
};

function guessSlotFromHour(date = new Date()): MealSlot {
  const h = date.getHours();
  if (h < 11) return "breakfast";
  if (h < 15) return "lunch";
  if (h < 18) return "afternoon_snack";
  if (h < 21) return "dinner";
  return "supper";
}

export default function ComerPage() {
  const router = useRouter();
  const defaultSlot = useMemo(() => guessSlotFromHour(), []);
  const [tab, setTab] = useState<"ai" | "saved">("saved");
  const [mealSlot, setMealSlot] = useState<MealSlot>(defaultSlot);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<DraftItem[] | null>(null);
  const [notes, setNotes] = useState<string | null>(null);
  const [alsoSaveToLibrary, setAlsoSaveToLibrary] = useState(true);

  const [saved, setSaved] = useState<SavedFood[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  async function refreshSaved() {
    setSavedLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSavedLoading(false);
      return;
    }
    const list = await listSavedFoods(supabase, user.id);
    setSaved(list);
    setSavedLoading(false);
  }

  useEffect(() => {
    void refreshSaved();
  }, []);

  useEffect(() => {
    if (tab === "saved") void refreshSaved();
  }, [tab]);

  async function estimate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDrafts(null);
    setNotes(null);
    try {
      const res = await fetch("/api/estimate-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mealSlot }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha na estimativa");
      setDrafts(
        (data.items as FoodEstimateItem[]).map((item) => ({
          ...item,
          mealSlot,
          rawText: text,
        })),
      );
      setNotes(data.notes ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  function updateDraft(index: number, patch: Partial<DraftItem>) {
    setDrafts((prev) =>
      prev
        ? prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
        : prev,
    );
  }

  async function confirm() {
    if (!drafts?.length) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setError("Sessão expirada");
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const rows = drafts.map((d) => ({
      user_id: user.id,
      logged_on: today,
      raw_text: d.rawText,
      label: d.label,
      meal_slot: mealSlot,
      calories: Math.round(Number(d.calories) || 0),
      protein: Number(d.protein) || 0,
      carbs: Number(d.carbs) || 0,
      fat: Number(d.fat) || 0,
      confidence: d.confidence,
      source: "ai" as const,
    }));

    const { error: insertError } = await supabase.from("food_entries").insert(rows);
    if (insertError) {
      setSaving(false);
      setError(insertError.message);
      return;
    }

    if (alsoSaveToLibrary) {
      for (const d of drafts) {
        await upsertSavedFood(supabase, user.id, {
          label: d.label,
          calories: d.calories,
          protein: d.protein,
          carbs: d.carbs,
          fat: d.fat,
          default_meal_slot: mealSlot,
        });
      }
    }

    const { onFoodLogged } = await import("@/lib/gamification");
    const result = await onFoodLogged(supabase, user.id, today, rows.length);
    const { feedbackQuery } = await import("@/lib/feedback");

    setSaving(false);
    router.push(`/hoje${feedbackQuery(result)}`);
    router.refresh();
  }

  async function onImport(item: SavedFood) {
    setImportingId(item.id);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setImportingId(null);
      setError("Sessão expirada");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const { error: importError } = await importSavedFoodToDay(
      supabase,
      user.id,
      item,
      mealSlot,
      today,
    );
    if (importError) {
      setImportingId(null);
      setError(importError);
      return;
    }

    const { onFoodLogged } = await import("@/lib/gamification");
    const result = await onFoodLogged(supabase, user.id, today, 1);
    const { feedbackQuery } = await import("@/lib/feedback");
    setImportingId(null);
    router.push(`/hoje${feedbackQuery(result)}`);
    router.refresh();
  }

  async function onDeleteSaved(id: string) {
    if (!confirm("Remover este alimento da sua base?")) return;
    const supabase = createClient();
    const err = await deleteSavedFood(supabase, id);
    if (err) {
      setError(err);
      return;
    }
    setSaved((prev) => prev.filter((s) => s.id !== id));
  }

  const filtered = saved.filter((s) =>
    s.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <ScreenChrome
      bg="#0A9396"
      heroBg="#005F73"
      backHref="/hoje"
      backLabel="Hoje"
      eyebrow="🥗 Alimentação"
      title="O que você comeu?"
      subtitle="Estime com IA ou importe da sua base — sem nova chamada."
    >
      <section className="overflow-hidden rounded-[1.5rem] bg-[var(--sand)]">
        <div className="bg-[var(--ink)] p-1.5">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setTab("saved")}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold ${
                tab === "saved"
                  ? "bg-[var(--amber)] text-[var(--ink)]"
                  : "text-white/65"
              }`}
            >
              <span aria-hidden>📚</span>
              Meus alimentos
            </button>
            <button
              type="button"
              onClick={() => setTab("ai")}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold ${
                tab === "ai"
                  ? "bg-[var(--mint)] text-[var(--ink)]"
                  : "text-white/65"
              }`}
            >
              <span aria-hidden>✨</span>
              Com IA
            </button>
          </div>
        </div>

        <div className="p-3">
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MEAL_SLOTS.map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => setMealSlot(slot.id)}
                className={`rounded-2xl px-3 py-2.5 text-left text-xs font-bold ${
                  mealSlot === slot.id
                    ? "bg-[var(--teal)] text-white"
                    : "bg-white text-[var(--ink)]"
                }`}
              >
                <span className="mr-1" aria-hidden>
                  {MEAL_EMOJI[slot.id]}
                </span>
                {slot.label}
              </button>
            ))}
          </div>

          {tab === "ai" ? (
            <form onSubmit={estimate} className="flex flex-col gap-3">
              <FieldBlock label="Texto livre">
                <textarea
                  required
                  rows={5}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Ex.: café com leite (200ml) e 1 pão com ovo"
                  className="w-full resize-none bg-transparent text-base font-medium text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
                />
              </FieldBlock>
              <p className="px-1 text-[11px] text-[var(--muted)]">
                Estimativa automática — não é consulta nutricional.
              </p>
              <button
                type="submit"
                disabled={loading || !text.trim()}
                className="rounded-2xl bg-[var(--ink)] px-4 py-3.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {loading ? "Estimando…" : "✨ Estimar calorias"}
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-3">
              <FieldBlock label="Buscar na base">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ex.: café com leite"
                  className="w-full bg-transparent text-base font-bold outline-none placeholder:font-medium placeholder:text-[var(--muted)]"
                />
              </FieldBlock>

              {savedLoading ? (
                <p className="py-6 text-center text-sm text-[var(--muted)]">
                  Carregando…
                </p>
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl bg-white px-4 py-6 text-center shadow-sm">
                  <p className="text-sm font-bold text-[var(--ink)]">
                    Base vazia por enquanto
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Ao confirmar um item com IA, marque “salvar na minha base”.
                  </p>
                </div>
              ) : (
                <ul className="overflow-hidden rounded-2xl bg-white shadow-sm">
                  {filtered.map((item, i) => (
                    <li
                      key={item.id}
                      className={`flex items-center gap-2 px-3 py-3 ${
                        i > 0 ? "border-t border-dashed border-[var(--ink)]/10" : ""
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onImport(item)}
                        disabled={importingId === item.id}
                        className="min-w-0 flex-1 text-left disabled:opacity-60"
                      >
                        <span className="block truncate text-sm font-bold text-[var(--ink)]">
                          {item.label}
                        </span>
                        <span className="text-[11px] text-[var(--muted)]">
                          {item.calories} kcal · toque para lançar
                        </span>
                      </button>
                      <Link
                        href={`/voce/alimentos/${item.id}`}
                        className="shrink-0 rounded-lg bg-[var(--sand)] px-2 py-1.5 text-xs font-bold text-[var(--ink)]"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => onDeleteSaved(item.id)}
                        className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-[var(--crimson)]"
                        aria-label="Remover"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="px-1 text-[11px] text-[var(--muted)]">
                Toque no item para lançar no dia · refeição selecionada acima · sem
                IA.
              </p>
            </div>
          )}
        </div>
      </section>

      {error ? (
        <p className="rounded-2xl bg-[var(--sand)] px-4 py-3 text-sm font-semibold text-[var(--crimson)]">
          {error}
        </p>
      ) : null}

      {tab === "ai" && drafts ? (
        <FormCard title="Nota · conferência" emoji="🧾" darkHeader>
          <button
            type="button"
            onClick={confirm}
            disabled={saving}
            className="w-full rounded-2xl bg-[var(--teal)] px-4 py-3.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Salvando…" : "✅ Confirmar no dia"}
          </button>

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[var(--ink)] shadow-sm">
            <input
              type="checkbox"
              checked={alsoSaveToLibrary}
              onChange={(e) => setAlsoSaveToLibrary(e.target.checked)}
              className="h-4 w-4 accent-[var(--teal)]"
            />
            <span>
              Também salvar na minha base
              <span className="mt-0.5 block text-[11px] font-medium text-[var(--muted)]">
                Reutilizar depois sem IA
              </span>
            </span>
          </label>

          {notes ? (
            <p className="rounded-2xl bg-white px-4 py-3 text-sm text-[var(--deep)]">
              {notes}
            </p>
          ) : null}
          {drafts.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              className="rounded-2xl bg-white px-4 py-3 shadow-sm"
            >
              <label className="block text-[10px] font-bold tracking-[0.16em] text-[var(--muted)] uppercase">
                Item
                <input
                  value={item.label}
                  onChange={(e) => updateDraft(index, { label: e.target.value })}
                  className="mt-2 w-full bg-transparent text-sm font-bold text-[var(--ink)] outline-none"
                />
              </label>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(
                  [
                    ["calories", "kcal"],
                    ["protein", "prot."],
                    ["carbs", "carbo"],
                    ["fat", "gord."],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="rounded-xl bg-[var(--sand)]/60 px-2 py-2 text-[10px] font-bold tracking-wide text-[var(--muted)] uppercase"
                  >
                    {label}
                    <input
                      type="number"
                      min={0}
                      step={key === "calories" ? 1 : 0.1}
                      value={item[key]}
                      onChange={(e) =>
                        updateDraft(index, {
                          [key]: Number(e.target.value),
                        } as Partial<DraftItem>)
                      }
                      className="mt-1 w-full bg-transparent text-sm font-bold tabular-nums text-[var(--ink)] outline-none"
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </FormCard>
      ) : null}
    </ScreenChrome>
  );
}
