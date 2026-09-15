import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  balanceNegativeCopy,
  balanceNeutralCopy,
  balancePositiveCopy,
} from "@/domain/copy";
import { AppNav } from "@/components/AppNav";
import { AppShell } from "@/components/AppShell";
import { FeedbackToast } from "@/components/FeedbackToast";
import { HojeHeaderActions } from "@/components/HojeHeaderActions";
import { HojeLists } from "@/components/HojeLists";
import { LogoutButton } from "@/components/LogoutButton";

export default async function HojePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed_at) redirect("/onboarding");

  const today = new Date().toISOString().slice(0, 10);
  const todayLabel = new Date(today + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  const [
    { data: streak },
    { data: foods },
    { data: activities },
    { data: stepLog },
    { data: goals },
  ] = await Promise.all([
    supabase
      .from("streaks")
      .select("current_streak, freeze_count")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("food_entries")
      .select("id, label, calories, protein, carbs, fat, meal_slot, created_at")
      .eq("user_id", user.id)
      .eq("logged_on", today)
      .order("created_at", { ascending: true }),
    supabase
      .from("activity_entries")
      .select(
        "id, description, calories_burned, category, activity_type, duration_minutes, created_at",
      )
      .eq("user_id", user.id)
      .eq("logged_on", today)
      .order("created_at", { ascending: true }),
    supabase
      .from("step_logs")
      .select("steps")
      .eq("user_id", user.id)
      .eq("logged_on", today)
      .maybeSingle(),
    supabase
      .from("goals")
      .select("id, title, start_date, end_date, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .lte("start_date", today)
      .gte("end_date", today)
      .order("created_at", { ascending: false }),
  ]);

  const intake = (foods ?? []).reduce((s, f) => s + f.calories, 0);
  const expenditure = (activities ?? []).reduce(
    (s, a) => s + a.calories_burned,
    0,
  );
  const balance = intake - expenditure;
  const copyPool =
    balance > 50
      ? balancePositiveCopy
      : balance < -50
        ? balanceNegativeCopy
        : balanceNeutralCopy;
  const copy = copyPool[Math.abs(balance) % copyPool.length];
  const streakCount = streak?.current_streak ?? 0;
  const freezeCount =
    typeof streak?.freeze_count === "number" ? streak.freeze_count : null;

  return (
    <AppShell bg="#0A9396">
      <header className="flex items-center justify-between gap-3">
        <Image
          src="/brand/well.svg"
          alt="WELL"
          width={120}
          height={50}
          className="h-8 w-auto"
          priority
        />
        <div className="flex items-center gap-2">
          <HojeHeaderActions goals={goals ?? []} />
          <div className="hidden items-center gap-2 rounded-full bg-[var(--amber)] px-3 py-1.5 text-sm font-bold text-[var(--ink)] sm:inline-flex">
            <span aria-hidden>🔥</span>
            {streakCount}
            {freezeCount != null ? ` · ${freezeCount} freeze` : ""}
          </div>
          <LogoutButton />
        </div>
      </header>

      <section className="relative mt-5 overflow-hidden rounded-[1.75rem] bg-[#005F73] px-5 py-6">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-bold uppercase tracking-wide text-white/70">
            Saldo do dia
          </p>
          <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center">
            <p className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold capitalize text-white">
              {todayLabel}
            </p>
            <p className="inline-flex items-center gap-1 rounded-full bg-[var(--amber)] px-2.5 py-1 text-xs font-bold text-[var(--ink)] sm:hidden">
              <span aria-hidden>🔥</span>
              {streakCount}
              {freezeCount != null ? ` · ${freezeCount}f` : ""}
            </p>
          </div>
        </div>
        <p className="mt-2 font-sans text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
          {balance > 0 ? "+" : ""}
          {balance}
          <span className="ml-1 text-xl font-bold opacity-80">kcal</span>
        </p>
        <p className="mt-2 text-sm font-semibold text-white/80">{copy}</p>
        <dl className="mt-5 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-2xl bg-black/20 px-4 py-3 text-white">
            <dt className="text-xs text-white/70">Consumido</dt>
            <dd className="mt-1 text-lg font-bold">{intake}</dd>
          </div>
          <div className="rounded-2xl bg-black/20 px-4 py-3 text-white">
            <dt className="text-xs text-white/70">Gasto</dt>
            <dd className="mt-1 text-lg font-bold">{expenditure}</dd>
          </div>
        </dl>
      </section>

      <HojeLists
        foods={(foods ?? []).map((f) => ({
          id: f.id,
          label: f.label,
          calories: f.calories,
          meal_slot: f.meal_slot,
        }))}
        activities={(activities ?? []).map((a) => ({
          id: a.id,
          description: a.description,
          calories_burned: a.calories_burned,
          category: a.category,
          activity_type: a.activity_type,
          duration_minutes: a.duration_minutes,
        }))}
        stepsToday={stepLog?.steps ?? 0}
      />

      <Suspense fallback={null}>
        <FeedbackToast />
      </Suspense>
      <AppNav active="/hoje" />
    </AppShell>
  );
}
