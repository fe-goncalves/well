"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ACTIVITY_TYPES,
  searchActivityTypes,
} from "@/domain/activity-types";
import {
  FieldBlock,
  FormCard,
  ScreenChrome,
} from "@/components/ScreenChrome";

export default function EditActivityPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loadingEntry, setLoadingEntry] = useState(true);
  const [query, setQuery] = useState("");
  const [activityType, setActivityType] = useState("other");
  const [description, setDescription] = useState("");
  const [calories, setCalories] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => searchActivityTypes(query), [query]);
  const selected = ACTIVITY_TYPES.find((t) => t.id === activityType);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data, error: loadError } = await supabase
        .from("activity_entries")
        .select("*")
        .eq("id", id)
        .single();
      if (cancelled) return;
      if (loadError || !data) {
        setError(loadError?.message ?? "Atividade não encontrada");
        setLoadingEntry(false);
        return;
      }
      setActivityType(data.activity_type || data.category || "other");
      setDescription(data.description ?? "");
      setCalories(String(data.calories_burned ?? 0));
      setDuration(
        data.duration_minutes != null ? String(data.duration_minutes) : "",
      );
      setNotes(data.notes ?? "");
      setLoadingEntry(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const burned = Math.round(Number(calories));
    if (!Number.isFinite(burned) || burned < 0) {
      setSaving(false);
      setError("Informe as calorias gastas.");
      return;
    }
    const mins =
      duration.trim() === "" ? null : Math.round(Number(duration));
    const type = ACTIVITY_TYPES.find((t) => t.id === activityType);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("activity_entries")
      .update({
        category: type?.group ?? "other",
        activity_type: activityType,
        description: description.trim() || type?.label || "Atividade",
        calories_burned: burned,
        duration_minutes: mins,
        notes: notes.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.push("/hoje");
    router.refresh();
  }

  async function remove() {
    if (!confirm("Apagar esta atividade?")) return;
    const supabase = createClient();
    await supabase.from("activity_entries").delete().eq("id", id);
    router.push("/hoje");
    router.refresh();
  }

  if (loadingEntry) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-[#EE9B00] text-sm text-[var(--ink)]/70">
        Carregando…
      </div>
    );
  }

  return (
    <ScreenChrome
      bg="#EE9B00"
      heroBg="#CA6702"
      backHref="/hoje"
      backLabel="Hoje"
      eyebrow="✏️ Editar atividade"
      title={description || selected?.label || "Atividade"}
      subtitle="Ajuste tipo, tempo, kcal e anotações."
      logoWhite
    >
      <form onSubmit={save} className="flex flex-col gap-5">
        <FormCard title="Tipo" emoji="🔎" darkHeader>
          <FieldBlock label="Pesquisar">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-base font-bold outline-none"
            />
          </FieldBlock>
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-2xl bg-white p-2">
            {filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActivityType(t.id)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold ${
                  activityType === t.id
                    ? "bg-[var(--amber)]"
                    : "hover:bg-[var(--sand)]/60"
                }`}
              >
                <span aria-hidden>{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>
        </FormCard>

        <FormCard title="Detalhes" emoji="📝">
          <FieldBlock label="Descrição">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-transparent text-base font-bold outline-none"
            />
          </FieldBlock>
          <div className="grid grid-cols-2 gap-2">
            <FieldBlock label="Tempo (min)">
              <input
                type="number"
                min={0}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-transparent text-base font-bold tabular-nums outline-none"
              />
            </FieldBlock>
            <FieldBlock label="kcal">
              <input
                type="number"
                required
                min={0}
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="w-full bg-transparent text-base font-bold tabular-nums outline-none"
              />
            </FieldBlock>
          </div>
          <FieldBlock label="Anotações">
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full resize-none bg-transparent text-sm outline-none"
            />
          </FieldBlock>
        </FormCard>

        {error ? (
          <p className="rounded-2xl bg-[var(--sand)] px-4 py-3 text-sm font-semibold text-[var(--crimson)]">
            {error}
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={remove}
            className="rounded-2xl bg-white/20 px-4 py-3.5 text-sm font-bold text-white"
          >
            🗑️ Apagar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-[var(--ink)] px-4 py-3.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Salvando…" : "💾 Salvar"}
          </button>
        </div>
      </form>
    </ScreenChrome>
  );
}
