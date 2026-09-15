"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  FieldBlock,
  FormCard,
  ScreenChrome,
} from "@/components/ScreenChrome";
import { upsertSavedFood } from "@/lib/food-saved";

/** Edita um item da biblioteca — não altera lançamentos do dia já feitos. */
export default function EditSavedFoodPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data, error: loadError } = await supabase
        .from("food_saved")
        .select("*")
        .eq("id", id)
        .single();
      if (cancelled) return;
      if (loadError || !data) {
        setError(loadError?.message ?? "Não encontrado");
        setLoading(false);
        return;
      }
      setLabel(data.label);
      setCalories(data.calories);
      setProtein(Number(data.protein));
      setCarbs(Number(data.carbs));
      setFat(Number(data.fat));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMsg(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setError("Sessão expirada");
      return;
    }

    // Update by id directly — não cria duplicata; não mexe em food_entries
    const { error: updateError } = await supabase
      .from("food_saved")
      .update({
        label: label.trim(),
        calories: Math.round(calories),
        protein,
        carbs,
        fat,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    setSaving(false);
    if (updateError) {
      // Se mudou o label para um que já existe, tenta upsert lógico
      if (updateError.message.includes("unique")) {
        const r = await upsertSavedFood(supabase, user.id, {
          label,
          calories,
          protein,
          carbs,
          fat,
        });
        if ("error" in r) {
          setError(r.error);
          return;
        }
      } else {
        setError(updateError.message);
        return;
      }
    }
    setMsg("Base atualizada. Lançamentos antigos do dia não mudam.");
  }

  async function remove() {
    if (!confirm("Remover da base?")) return;
    const supabase = createClient();
    await supabase.from("food_saved").delete().eq("id", id);
    router.push("/voce");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-[#001219] text-sm text-white/60">
        Carregando…
      </div>
    );
  }

  return (
    <ScreenChrome
      bg="#001219"
      heroBg="#005F73"
      backHref="/voce"
      backLabel="Você"
      eyebrow="📚 Biblioteca"
      title={label || "Alimento"}
      subtitle="Editar aqui só muda a base — não altera o que já foi lançado nos dias."
      logoWhite
    >
      <form onSubmit={save} className="flex flex-col gap-5">
        <button
          type="submit"
          disabled={saving || !label.trim()}
          className="rounded-2xl bg-[var(--teal)] px-4 py-3.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? "Salvando…" : "💾 Salvar na base"}
        </button>

        <FormCard title="Macros" emoji="🧾" darkHeader>
          <FieldBlock label="Nome">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-transparent text-base font-bold outline-none"
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
              <div key={lab} className="rounded-2xl bg-white px-3 py-3 shadow-sm">
                <p className="text-[10px] font-bold text-[var(--muted)] uppercase">
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
        {msg ? (
          <p className="rounded-2xl bg-[var(--mint)] px-4 py-3 text-sm font-semibold text-[var(--deep)]">
            {msg}
          </p>
        ) : null}

        <button
          type="button"
          onClick={remove}
          className="rounded-2xl bg-white/15 px-4 py-3 text-sm font-bold text-white"
        >
          🗑️ Remover da base
        </button>
      </form>
    </ScreenChrome>
  );
}
