"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { FieldBlock } from "@/components/ScreenChrome";
import { LogoutButton } from "@/components/LogoutButton";
import {
  deleteSavedFood,
  listSavedFoods,
  type SavedFood,
} from "@/lib/food-saved";

type Rhythm = "light" | "standard" | "firm";

const RHYTHM_META: {
  id: Rhythm;
  label: string;
  emoji: string;
  hint: string;
}[] = [
  { id: "light", label: "Leve", emoji: "🍃", hint: "XP oculto · streak visível" },
  {
    id: "standard",
    label: "Padrão",
    emoji: "⚖️",
    hint: "XP, streak e metas gentis",
  },
  {
    id: "firm",
    label: "Firme",
    emoji: "🔥",
    hint: "Mais explícito + lembrete 20h",
  },
];

function validUsername(u: string) {
  return /^[a-zA-Z0-9_]{3,24}$/.test(u);
}

function CollapsibleSection({
  id,
  title,
  emoji,
  summary,
  openId,
  setOpenId,
  children,
}: {
  id: string;
  title: string;
  emoji: string;
  summary?: string;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  children: ReactNode;
}) {
  const open = openId === id;
  return (
    <section className="mt-5 overflow-hidden rounded-[1.5rem] bg-[var(--sand)]">
      <button
        type="button"
        onClick={() => setOpenId(open ? null : id)}
        className="flex w-full items-center gap-2 bg-[var(--ink)] px-4 py-3 text-left text-white"
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-sm font-bold">
            <span aria-hidden>{emoji}</span>
            {title}
          </span>
          {summary && !open ? (
            <span className="mt-0.5 block text-[11px] text-white/60">
              {summary}
            </span>
          ) : null}
        </span>
        <span className="text-sm font-bold text-white/70" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>
      {open ? <div className="space-y-3 p-3">{children}</div> : null}
    </section>
  );
}

export default function VocePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  // Identidade
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [identityMsg, setIdentityMsg] = useState<string | null>(null);
  const [identityErr, setIdentityErr] = useState<string | null>(null);
  const [savingIdentity, setSavingIdentity] = useState(false);

  // Conta (auth)
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountMsg, setAccountMsg] = useState<string | null>(null);
  const [accountErr, setAccountErr] = useState<string | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);

  // Corpo
  const [birthDate, setBirthDate] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [bodyMsg, setBodyMsg] = useState<string | null>(null);
  const [bodyErr, setBodyErr] = useState<string | null>(null);
  const [savingBody, setSavingBody] = useState(false);

  // Ritmo
  const [rhythm, setRhythm] = useState<Rhythm>("standard");
  const [rhythmMsg, setRhythmMsg] = useState<string | null>(null);
  const [savingRhythm, setSavingRhythm] = useState(false);

  // Alimentos
  const [saved, setSaved] = useState<SavedFood[]>([]);
  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setEmail(user.email ?? "");
      setNewEmail(user.email ?? "");

      const { data } = await supabase
        .from("profiles")
        .select(
          "display_name, username, birth_date, height_cm, rhythm_mode",
        )
        .eq("id", user.id)
        .single();
      if (data) {
        setName(data.display_name ?? "");
        setUsername(data.username ?? "");
        setBirthDate(data.birth_date ?? "");
        setHeightCm(data.height_cm != null ? String(data.height_cm) : "");
        setRhythm((data.rhythm_mode as Rhythm) ?? "standard");
      }
      setSaved(await listSavedFoods(supabase, user.id));
      setLoading(false);
    })();
  }, [router]);

  async function saveIdentity(e: FormEvent) {
    e.preventDefault();
    setSavingIdentity(true);
    setIdentityErr(null);
    setIdentityMsg(null);
    const uname = username.trim();
    if (uname && !validUsername(uname)) {
      setSavingIdentity(false);
      setIdentityErr("Username: 3–24 caracteres, só letras, números e _.");
      return;
    }
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSavingIdentity(false);
      setIdentityErr("Sessão expirada");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: name.trim() || null,
        username: uname || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    setSavingIdentity(false);
    if (error) {
      setIdentityErr(
        error.message.includes("profiles_username_unique")
          ? "Este username já está em uso."
          : error.message,
      );
      return;
    }
    setIdentityMsg("Identidade salva.");
  }

  async function saveAccount(e: FormEvent) {
    e.preventDefault();
    setSavingAccount(true);
    setAccountErr(null);
    setAccountMsg(null);
    const supabase = createClient();
    const updates: { email?: string; password?: string } = {};

    if (newEmail.trim() && newEmail.trim() !== email) {
      updates.email = newEmail.trim();
    }
    if (newPassword) {
      if (newPassword.length < 6) {
        setSavingAccount(false);
        setAccountErr("Senha mínima: 6 caracteres.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setSavingAccount(false);
        setAccountErr("As senhas não coincidem.");
        return;
      }
      updates.password = newPassword;
    }
    if (!updates.email && !updates.password) {
      setSavingAccount(false);
      setAccountErr("Nada para atualizar.");
      return;
    }
    const { error } = await supabase.auth.updateUser(updates);
    setSavingAccount(false);
    if (error) {
      setAccountErr(error.message);
      return;
    }
    if (updates.email) {
      setEmail(updates.email);
      setAccountMsg(
        "E-mail atualizado. Se o Supabase pedir confirmação, verifique a caixa de entrada.",
      );
    } else {
      setAccountMsg("Senha atualizada.");
    }
    setNewPassword("");
    setConfirmPassword("");
  }

  async function saveBody(e: FormEvent) {
    e.preventDefault();
    setSavingBody(true);
    setBodyErr(null);
    setBodyMsg(null);
    const h = Number(heightCm);
    if (!Number.isFinite(h) || h < 100 || h > 250) {
      setSavingBody(false);
      setBodyErr("Altura inválida.");
      return;
    }
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSavingBody(false);
      setBodyErr("Sessão expirada");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({
        birth_date: birthDate || null,
        height_cm: h,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    setSavingBody(false);
    if (error) {
      setBodyErr(error.message);
      return;
    }
    setBodyMsg("Dados corporais salvos.");
  }

  async function saveRhythm() {
    setSavingRhythm(true);
    setRhythmMsg(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSavingRhythm(false);
      return;
    }
    await supabase
      .from("profiles")
      .update({
        rhythm_mode: rhythm,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    setSavingRhythm(false);
    setRhythmMsg("Modo atualizado.");
  }

  async function removeSaved(id: string) {
    if (!window.confirm("Remover da base?")) return;
    const supabase = createClient();
    const err = await deleteSavedFood(supabase, id);
    if (!err) setSaved((prev) => prev.filter((s) => s.id !== id));
  }

  if (loading) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-[#001219] text-sm text-white/60">
        Carregando…
      </div>
    );
  }

  return (
    <div className="min-h-full flex-1 bg-[#001219]">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-32 pt-6 sm:max-w-2xl">
        <header className="flex items-center justify-between gap-4">
          <Image
            src="/brand/well.svg"
            alt="WELL"
            width={120}
            height={50}
            className="h-8 w-auto brightness-0 invert"
          />
          <LogoutButton className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold text-white" />
        </header>

        <section className="relative mt-6 overflow-hidden rounded-[1.75rem] bg-[#005F73] px-5 py-6">
          <p className="text-sm font-bold uppercase tracking-wide text-white/70">
            Você
          </p>
          <p className="mt-2 font-sans text-4xl font-extrabold tracking-tight text-white">
            {name.trim() || "Sem nome"}
          </p>
          <p className="mt-2 text-sm font-semibold text-white/80">
            {username ? `@${username}` : "sem username"} · {email || "—"}
          </p>
        </section>

        {/* 1. Identidade */}
        <CollapsibleSection
          id="identity"
          title="Identidade"
          emoji="👤"
          summary={name.trim() || "Nome e username"}
          openId={openSection}
          setOpenId={setOpenSection}
        >
          <form onSubmit={saveIdentity} className="space-y-3">
            <p className="px-1 text-[11px] text-[var(--muted)]">
              Como você aparece no WELL. Username é único.
            </p>
            <FieldBlock label="Nome chamado">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent text-base font-bold outline-none"
              />
            </FieldBlock>
            <FieldBlock label="Username">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex.: maria_well"
                className="w-full bg-transparent text-base font-bold outline-none placeholder:font-medium placeholder:text-[var(--muted)]"
              />
            </FieldBlock>
            {identityErr ? (
              <p className="text-xs font-semibold text-[var(--crimson)]">
                {identityErr}
              </p>
            ) : null}
            {identityMsg ? (
              <p className="text-xs font-semibold text-[var(--deep)]">
                {identityMsg}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={savingIdentity}
              className="w-full rounded-2xl bg-[var(--teal)] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {savingIdentity ? "Salvando…" : "Salvar identidade"}
            </button>
          </form>
        </CollapsibleSection>

        {/* 2. Conta */}
        <CollapsibleSection
          id="account"
          title="Conta e segurança"
          emoji="🔐"
          summary={email || "E-mail e senha"}
          openId={openSection}
          setOpenId={setOpenSection}
        >
          <form onSubmit={saveAccount} className="space-y-3">
            <p className="px-1 text-[11px] text-[var(--muted)]">
              E-mail e senha passam pelo Auth. Não ficam no perfil público.
            </p>
            <FieldBlock label="E-mail">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full bg-transparent text-base font-bold outline-none"
              />
            </FieldBlock>
            <FieldBlock label="Nova senha">
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Deixe vazio para não mudar"
                className="w-full bg-transparent text-base font-bold outline-none placeholder:font-medium placeholder:text-[var(--muted)]"
              />
            </FieldBlock>
            <FieldBlock label="Confirmar senha">
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-transparent text-base font-bold outline-none"
              />
            </FieldBlock>
            {accountErr ? (
              <p className="text-xs font-semibold text-[var(--crimson)]">
                {accountErr}
              </p>
            ) : null}
            {accountMsg ? (
              <p className="text-xs font-semibold text-[var(--deep)]">
                {accountMsg}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={savingAccount}
              className="w-full rounded-2xl bg-[var(--ink)] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {savingAccount ? "Atualizando…" : "Atualizar conta"}
            </button>
          </form>
        </CollapsibleSection>

        {/* 3. Corpo */}
        <CollapsibleSection
          id="body"
          title="Dados corporais"
          emoji="📏"
          summary={
            heightCm
              ? `${heightCm} cm${birthDate ? ` · nasc. ${birthDate}` : ""}`
              : "Nascimento e altura"
          }
          openId={openSection}
          setOpenId={setOpenSection}
        >
          <form onSubmit={saveBody} className="space-y-3">
            <p className="px-1 text-[11px] text-[var(--muted)]">
              Usados só como base para sugestões de objetivos. Peso fica na
              Jornada.
            </p>
            <FieldBlock label="Data de nascimento">
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-transparent text-sm font-bold outline-none"
              />
            </FieldBlock>
            <FieldBlock label="Altura (cm)">
              <input
                type="number"
                min={100}
                max={250}
                step="any"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="w-full bg-transparent text-base font-bold tabular-nums outline-none"
              />
            </FieldBlock>
            {bodyErr ? (
              <p className="text-xs font-semibold text-[var(--crimson)]">
                {bodyErr}
              </p>
            ) : null}
            {bodyMsg ? (
              <p className="text-xs font-semibold text-[var(--deep)]">
                {bodyMsg}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={savingBody}
              className="w-full rounded-2xl bg-[var(--teal)] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {savingBody ? "Salvando…" : "Salvar dados"}
            </button>
          </form>
        </CollapsibleSection>

        {/* 4. Alimentos */}
        <CollapsibleSection
          id="foods"
          title="Alimentos salvos"
          emoji="📚"
          summary={`${saved.length} na base`}
          openId={openSection}
          setOpenId={setOpenSection}
        >
          <div className="flex justify-end">
            <Link
              href="/hoje/comer"
              className="rounded-full bg-[var(--mint)] px-3 py-1 text-xs font-bold text-[var(--ink)]"
            >
              Abrir Comer
            </Link>
          </div>
          {saved.length === 0 ? (
            <p className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-[var(--muted)] shadow-sm">
              Nenhum alimento na base ainda.
            </p>
          ) : (
            <ul className="overflow-hidden rounded-2xl bg-white shadow-sm">
              {saved.map((s, i) => (
                <li
                  key={s.id}
                  className={`flex items-center gap-2 px-3 py-3 ${
                    i > 0 ? "border-t border-dashed border-[var(--ink)]/10" : ""
                  }`}
                >
                  <Link
                    href={`/voce/alimentos/${s.id}`}
                    className="min-w-0 flex-1"
                  >
                    <span className="block truncate text-sm font-bold">
                      {s.label}
                    </span>
                    <span className="text-[11px] text-[var(--muted)]">
                      {s.calories} kcal · editar
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeSaved(s.id)}
                    className="text-xs font-bold text-[var(--crimson)]"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CollapsibleSection>

        {/* 5. Modo */}
        <CollapsibleSection
          id="rhythm"
          title="Modo de uso"
          emoji="🎚️"
          summary={RHYTHM_META.find((r) => r.id === rhythm)?.label}
          openId={openSection}
          setOpenId={setOpenSection}
        >
          <div className="grid grid-cols-3 gap-2">
            {RHYTHM_META.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRhythm(r.id)}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-2.5 text-xs font-bold ${
                  rhythm === r.id
                    ? r.id === "firm"
                      ? "bg-[var(--amber)] text-[var(--ink)]"
                      : r.id === "light"
                        ? "bg-[var(--mint)] text-[var(--ink)]"
                        : "bg-[var(--ink)] text-white"
                    : "bg-white text-[var(--ink)]"
                }`}
              >
                <span aria-hidden>{r.emoji}</span>
                {r.label}
              </button>
            ))}
          </div>
          <div className="rounded-2xl bg-white px-4 py-4 text-center shadow-sm">
            <p className="text-sm font-semibold">
              {RHYTHM_META.find((r) => r.id === rhythm)?.hint}
            </p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Não muda calorias — só o destaque de jogo e metas.
            </p>
          </div>
          {rhythmMsg ? (
            <p className="text-center text-xs font-semibold text-[var(--deep)]">
              {rhythmMsg}
            </p>
          ) : null}
          <button
            type="button"
            onClick={saveRhythm}
            disabled={savingRhythm}
            className="w-full rounded-2xl bg-[var(--teal)] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {savingRhythm ? "Salvando…" : "Salvar modo"}
          </button>
        </CollapsibleSection>

        <AppNav active="/voce" />
      </div>
    </div>
  );
}
