import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/AppNav";
import { LogoutButton } from "@/components/LogoutButton";
import { levelFromXp, xpForNextLevel } from "@/domain";

const BADGE_EMOJI: Record<string, string> = {
  first_plate: "🍽️",
  first_move: "🏃",
  first_page: "📔",
  honest_fork: "✏️",
  streak_7: "🔥",
  streak_30: "💪",
  streak_100: "👑",
  goal_maker: "🎯",
  goal_finisher: "🏁",
  photo_day: "📷",
  week_logger: "📅",
  balance_aware: "📊",
};

export default async function ConquistasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: streak }, { data: badges }, { data: earned }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("xp, level, rhythm_mode, onboarding_completed_at")
        .eq("id", user.id)
        .single(),
      supabase
        .from("streaks")
        .select("current_streak, longest_streak, freeze_count")
        .eq("user_id", user.id)
        .single(),
      supabase.from("badges").select("*").order("xp_bonus", { ascending: true }),
      supabase
        .from("user_badges")
        .select("badge_id, earned_at")
        .eq("user_id", user.id),
    ]);

  if (!profile?.onboarding_completed_at) redirect("/onboarding");

  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? levelFromXp(xp);
  const next = xpForNextLevel(level);
  const prev = xpForNextLevel(level - 1);
  const intoLevel = Math.max(0, xp - prev);
  const span = Math.max(1, next - prev);
  const pct = Math.min(100, Math.round((intoLevel / span) * 100));
  const hideXp = profile?.rhythm_mode === "light";
  const earnedMap = new Map(
    (earned ?? []).map((e) => [e.badge_id, e.earned_at]),
  );
  const earnedCount = earnedMap.size;
  const totalBadges = (badges ?? []).length;

  const earnedBadges = (badges ?? []).filter((b) => earnedMap.has(b.id));
  const lockedBadges = (badges ?? []).filter((b) => !earnedMap.has(b.id));

  return (
    <div className="min-h-full flex-1 bg-[#EE9B00]">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-32 pt-6 sm:max-w-2xl">
        <header className="flex items-center justify-between gap-4">
          <Image
            src="/brand/well.svg"
            alt="WELL"
            width={120}
            height={50}
            className="h-8 w-auto brightness-0 invert"
          />
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[var(--ink)]/15 px-3 py-1.5 text-sm font-bold text-[var(--ink)]">
              🏆 Conquistas
            </span>
            <LogoutButton className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ink)]/15 px-3 py-1.5 text-sm font-bold text-[var(--ink)]" />
          </div>
        </header>

        {/* Streak hero */}
        <section className="relative mt-6 overflow-hidden rounded-[1.75rem] bg-[#CA6702] px-5 py-6">
          <p className="text-sm font-bold uppercase tracking-wide text-white/75">
            Streak
          </p>
          <p className="mt-2 font-sans text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
            <span aria-hidden className="mr-1 text-4xl">
              🔥
            </span>
            {streak?.current_streak ?? 0}
            <span className="ml-1 text-xl font-bold opacity-80">dias</span>
          </p>
          <p className="mt-2 text-sm font-semibold text-white/80">
            Recorde {streak?.longest_streak ?? 0} ·{" "}
            {streak?.freeze_count ?? 0} freeze
            {(streak?.freeze_count ?? 0) === 1 ? "" : "s"}
          </p>

          <dl className="mt-5 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl bg-black/20 px-4 py-3 text-white">
              <dt className="text-xs text-white/70">Badges</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums">
                {earnedCount}/{totalBadges}
              </dd>
            </div>
            <div className="rounded-2xl bg-black/20 px-4 py-3 text-white">
              <dt className="text-xs text-white/70">
                {hideXp ? "Modo" : "Nível"}
              </dt>
              <dd className="mt-1 text-lg font-bold tabular-nums">
                {hideXp ? "Leve" : level}
              </dd>
            </div>
          </dl>

          {!hideXp ? (
            <div className="mt-4 rounded-2xl bg-black/20 px-4 py-3 text-white">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">XP no nível</span>
                <span className="font-bold tabular-nums text-[var(--sand)]">
                  {xp} · próximo {next}
                </span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-black/25">
                <div
                  className="h-full rounded-full bg-[var(--sand)]"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-white/65">
                {intoLevel} / {span} neste nível ({pct}%)
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm font-semibold text-white/75">
              Modo Leve: XP oculto — o streak segue como incentivo.
            </p>
          )}
        </section>

        {/* Badges — nota */}
        <section className="mt-5 overflow-hidden rounded-[1.5rem] bg-[var(--sand)]">
          <div className="flex items-center gap-2 bg-[var(--ink)] px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-bold text-white">
              <span aria-hidden>🏆</span>
              Badges
            </p>
            <span className="ml-auto rounded-full bg-[var(--amber)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--ink)]">
              {earnedCount} conquistados
            </span>
          </div>

          <div className="p-3">
            <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
              <p className="text-center text-[10px] font-bold tracking-[0.2em] text-[var(--muted)] uppercase">
                Nota · conquistas
              </p>

              {earnedBadges.length > 0 ? (
                <div className="mt-4">
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-bold tracking-wide text-[var(--muted)] uppercase">
                    <span aria-hidden>✨</span>
                    Desbloqueados
                  </p>
                  <ul>
                    {earnedBadges.map((b) => {
                      const at = earnedMap.get(b.id);
                      return (
                        <li
                          key={b.id}
                          className="flex items-start justify-between gap-3 border-b border-dashed border-[var(--ink)]/10 py-2.5 last:border-0"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5 text-sm font-bold text-[var(--ink)]">
                              <span aria-hidden>
                                {BADGE_EMOJI[b.id] ?? "🏅"}
                              </span>
                              {b.name}
                            </span>
                            <span className="mt-0.5 block text-[11px] text-[var(--muted)]">
                              {b.description}
                              {at
                                ? ` · ${new Date(at).toLocaleDateString("pt-BR")}`
                                : ""}
                            </span>
                          </span>
                          <span className="shrink-0 text-sm font-extrabold tabular-nums text-[var(--orange)]">
                            +{b.xp_bonus}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              {lockedBadges.length > 0 ? (
                <div className={earnedBadges.length > 0 ? "mt-2" : "mt-4"}>
                  {earnedBadges.length > 0 ? (
                    <div
                      className="mb-3 border-t border-dashed border-[var(--ink)]/20"
                      aria-hidden
                    />
                  ) : null}
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-bold tracking-wide text-[var(--muted)] uppercase">
                    <span aria-hidden>🔒</span>
                    Em aberto
                  </p>
                  <ul>
                    {lockedBadges.map((b) => (
                      <li
                        key={b.id}
                        className="flex items-start justify-between gap-3 border-b border-dashed border-[var(--ink)]/10 py-2.5 opacity-55 last:border-0"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 text-sm font-bold text-[var(--ink)]">
                            <span aria-hidden>
                              {BADGE_EMOJI[b.id] ?? "🏅"}
                            </span>
                            {b.name}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-[var(--muted)]">
                            {b.description}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-[var(--muted)]">
                          +{b.xp_bonus}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-3 border-t-2 border-[var(--ink)] pt-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-extrabold uppercase tracking-wide">
                    Progresso
                  </span>
                  <span className="text-lg font-extrabold tabular-nums text-[var(--orange)]">
                    {earnedCount}/{totalBadges}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <p className="mt-5 px-1 text-center text-xs font-semibold text-[var(--ink)]/70">
          Badges e XP são incentivo — não julgam o seu dia.
        </p>

        <AppNav active="/conquistas" />
      </div>
    </div>
  );
}
