"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  FieldBlock,
  FormCard,
  ScreenChrome,
} from "@/components/ScreenChrome";

export default function DiarioPage() {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entryId, setEntryId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("logged_on", today)
        .maybeSingle();

      if (cancelled) return;

      if (data) {
        setEntryId(data.id);
        setBody(data.body ?? "");
        setPhotoPath(data.photo_path);
        if (data.photo_path) {
          const { data: signed } = await supabase.storage
            .from("journal-photos")
            .createSignedUrl(data.photo_path, 60 * 60);
          if (!cancelled) setPhotoUrl(signed?.signedUrl ?? null);
        }
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  function onPickFile(next: File | null) {
    setFile(next);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(next ? URL.createObjectURL(next) : null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
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
    let nextPhotoPath = photoPath;

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setSaving(false);
        setError("A foto deve ter no máximo 5 MB.");
        return;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${today}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("journal-photos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) {
        setSaving(false);
        setError(uploadError.message);
        return;
      }
      nextPhotoPath = path;
    }

    const payload = {
      user_id: user.id,
      logged_on: today,
      body: body.trim(),
      photo_path: nextPhotoPath,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("journal_entries")
      .upsert(payload, { onConflict: "user_id,logged_on" });

    if (upsertError) {
      setSaving(false);
      setError(upsertError.message);
      return;
    }

    const { onJournalSaved } = await import("@/lib/gamification");
    const result = await onJournalSaved(supabase, user.id, today, {
      isNewDayEntry: !entryId,
      hasPhoto: Boolean(nextPhotoPath),
    });
    const { feedbackQuery } = await import("@/lib/feedback");

    setSaving(false);
    router.push(`/hoje${feedbackQuery(result)}`);
    router.refresh();
  }

  async function removePhoto() {
    const supabase = createClient();
    if (photoPath) {
      await supabase.storage.from("journal-photos").remove([photoPath]);
    }
    setPhotoPath(null);
    setPhotoUrl(null);
    onPickFile(null);

    if (entryId) {
      await supabase
        .from("journal_entries")
        .update({ photo_path: null, updated_at: new Date().toISOString() })
        .eq("id", entryId);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-[#005F73] text-sm text-white/70">
        Carregando…
      </div>
    );
  }

  const shownPhoto = preview || photoUrl;

  return (
    <ScreenChrome
      bg="#005F73"
      heroBg="#001219"
      backHref="/hoje"
      backLabel="Hoje"
      eyebrow="📔 Diário"
      title="Como foi o dia?"
      subtitle="Uma entrada por dia — edite quando quiser. Foto opcional."
      logoWhite
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <FormCard title="Texto" emoji="✍️" darkHeader>
          <FieldBlock label="Hoje">
            <textarea
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Humor, contexto, o que importou…"
              className="w-full resize-none bg-transparent text-base font-medium text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
            />
          </FieldBlock>
        </FormCard>

        <FormCard title="Foto do dia" emoji="📷">
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            {shownPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shownPhoto}
                alt="Foto do diário"
                className="max-h-72 w-full object-cover"
              />
            ) : (
              <div className="flex h-36 items-center justify-center text-sm text-[var(--muted)]">
                Nenhuma foto ainda
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="cursor-pointer rounded-2xl bg-[var(--teal)] px-4 py-2.5 text-xs font-bold text-white">
              {shownPhoto ? "Trocar foto" : "Anexar foto"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {shownPhoto ? (
              <button
                type="button"
                onClick={removePhoto}
                className="rounded-2xl bg-white px-4 py-2.5 text-xs font-bold text-[var(--crimson)]"
              >
                Remover
              </button>
            ) : null}
          </div>
        </FormCard>

        {error ? (
          <p className="rounded-2xl bg-[var(--sand)] px-4 py-3 text-sm font-semibold text-[var(--crimson)]">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving || (!body.trim() && !file && !photoPath)}
          className="rounded-2xl bg-[var(--amber)] px-4 py-3.5 text-sm font-bold text-[var(--ink)] disabled:opacity-60"
        >
          {saving
            ? "Salvando…"
            : entryId
              ? "💾 Atualizar diário"
              : "💾 Salvar diário"}
        </button>
      </form>
    </ScreenChrome>
  );
}
