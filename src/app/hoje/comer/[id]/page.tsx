"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { FoodEstimateItem, MealSlot } from "@/domain";
import { MEAL_SLOTS, mealSlotLabel } from "@/domain/meals";
import {
  FieldBlock,
  FormCard,
  ScreenChrome,
} from "@/components/ScreenChrome";
import { upsertSavedFood } from "@/lib/food-saved";

const MEAL_EMOJI: Record<string, string> = {
  breakfast: "🥐",
  lunch: "🍽️",
  afternoon_snack: "🍎",
  dinner: "🍲",
  supper: "🌙",
};

export default function EditFoodPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loadingEntry, setLoadingEntry] = useState(true);
  const [mealSlot, setMealSlot] = useState<MealSlot>("lunch");
  const [text, setText] = useState("");
  const [label, setLabel] = useState("");
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [confidence, setConfidence] = useState("medium");
  const [estimating, setEstimating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingLibrary, setSavingLibrary] = useState(false);
  const [libraryMsg, setLibraryMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data, error: loadError } = await supabase
        .from("food_entries")
        .select("*")
        .eq("id", id)
        .single();
      if (cancelled) return;
      if (loadError || !data) {
        setError(loadError?.message ?? "Item não encontrado");
        setLoadingEntry(false);
        return;
      }
      setText(data.raw_text);
      setLabel(data.label);
      setMealSlot(data.meal_slot);
      setCalories(data.calories);
      setProtein(Number(data.protein));
      setCarbs(Number(data.carbs));
      setFat(Number(data.fat));
      setConfidence(data.confidence);
      setLoadingEntry(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function reestimate(e: FormEvent) {
    e.preventDefault();
    setEstimating(true);
    setError(null);
    try {
      const res = await fetch("/api/estimate-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mealSlot }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha na estimativa");
      const first = (data.items as FoodEstimateItem[])[0];
      if (!first) throw new Error("Sem itens na resposta");
      const items = data.items as FoodEstimateItem[];
      setLabel(
        items.length === 1
          ? items[0].label
          : items.map((i) => i.label).join(" + "),
      );
      setCalories(items.reduce((s, i) => s + i.calories, 0));
      setProtein(items.reduce((s, i) => s + i.protein, 0));
      setCarbs(items.reduce((s, i) => s + i.carbs, 0));
      setFat(items.reduce((s, i) => s + i.fat, 0));
      setConfidence(first.confidence);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setEstimating(false);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("food_entries")
      .update({
        raw_text: text,
        label,
        meal_slot: mealSlot,
        calories: Math.round(calories),
        protein,
        carbs,
        fat,
        confidence,
        source: "ai_edited",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      setSaving(false);
      setError(updateError.message);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { onFoodEdited } = await import("@/lib/gamification");
      const result = await onFoodEdited(supabase, user.id);
      const { feedbackQuery } = await import("@/lib/feedback");
      setSaving(false);
      router.push(`/hoje${feedbackQuery(result)}`);
    } else {
      setSaving(false);
      router.push("/hoje");
    }
    router.refresh();
  }

  async function remove() {
    if (!confirm("Apagar este item?")) return;
    const supabase = createClient();
    await supabase.from("food_entries").delete().eq("id", id);
    router.push("/hoje");
    router.refresh();
  }

  async function saveToLibrary() {
    setSavingLibrary(true);
    setLibraryMsg(null);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSavingLibrary(false);
      setError("Sessão expirada");
      return;
    }
    const result = await upsertSavedFood(supabase, user.id, {
      label,
      calories,
      protein,
      carbs,
      fat,
      default_meal_slot: mealSlot,
    });
    setSavingLibrary(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setLibraryMsg("Salvo na sua base.");
  }

  if (loadingEntry) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-[#0A9396] text-sm text-white/70">
        Carregando…
      </div>
    );
  }

  return (
    <ScreenChrome
      bg="#0A9396"
      heroBg="#005F73"
      backHref="/hoje"
      backLabel="Hoje"
      eyebrow={`✏️ Editar · ${mealSlotLabel(mealSlot)}`}
      title="Reanalisar item"
      subtitle="Reescreva o texto, rode a IA de novo e ajuste os números."
    >
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={saveToLibrary}
          disabled={savingLibrary || !label.trim()}
          className="rounded-2xl bg-white/20 px-4 py-3.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {savingLibrary ? "…" : "📚 Salvar na base"}
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-2xl bg-[var(--ink)] px-4 py-3.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? "…" : "💾 Salvar no dia"}
        </button>
      </div>
      {libraryMsg ? (
        <p className="rounded-2xl bg-[var(--mint)] px-4 py-3 text-sm font-semibold text-[var(--deep)]">
          {libraryMsg}
        </p>
      ) : null}

      <form onSubmit={reestimate} className="flex flex-col gap-5">
        <FormCard title="Refeição" emoji="🍽️" darkHeader>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MEAL_SLOTS.map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => setMealSlot(slot.id)}
                className={`rounded-2xl px-3 py-3 text-left text-xs font-bold ${
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
        </FormCard>

        <FormCard title="Texto" emoji="✍️">
          <FieldBlock label="Descrição">
            <textarea
              required
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full resize-none bg-transparent text-base font-medium text-[var(--ink)] outline-none"
            />
          </FieldBlock>
        </FormCard>

        <button
          type="submit"
          disabled={estimating || !text.trim()}
          className="rounded-2xl bg-[var(--ink)] px-4 py-3.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {estimating ? "Reanalisando…" : "✨ Reanalisar com IA"}
        </button>
      </form>

      <FormCard title="Nota · valores" emoji="🧾" darkHeader>
        <FieldBlock label="Item">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full bg-transparent text-sm font-bold text-[var(--ink)] outline-none"
          />
        </FieldBlock>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              ["kcal", calories, setCalories, 1],
              ["prot.", protein, setProtein, 0.1],
              ["carbo", carbs, setCarbs, 0.1],
              ["gord.", fat, setFat, 0.1],
            ] as const
          ).map(([lab, val, set, step]) => (
            <div
              key={lab}
              className="rounded-2xl bg-white px-3 py-3 shadow-sm"
            >
              <p className="text-[10px] font-bold tracking-wide text-[var(--muted)] uppercase">
                {lab}
              </p>
              <input
                type="number"
                min={0}
                step={step}
                value={val}
                onChange={(e) => set(Number(e.target.value))}
                className="mt-1 w-full bg-transparent text-sm font-bold tabular-nums outline-none"
              />
            </div>
          ))}
        </div>
      </FormCard>

      {error ? (
        <p className="rounded-2xl bg-[var(--sand)] px-4 py-3 text-sm font-semibold text-[var(--crimson)]">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={remove}
        className="rounded-2xl bg-white/20 px-4 py-3.5 text-sm font-bold text-white"
      >
        🗑️ Apagar do dia
      </button>
    </ScreenChrome>
  );
}
