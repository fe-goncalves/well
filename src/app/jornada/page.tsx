import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/AppNav";
import { FeedbackToast } from "@/components/FeedbackToast";
import { GoalsSection } from "@/components/GoalsSection";
import { JornadaCalendar } from "@/components/JornadaCalendar";
import { LogoutButton } from "@/components/LogoutButton";
import { WeightPanel } from "@/components/WeightPanel";
import type { DayDetail } from "@/components/JornadaDayModal";
import {
  addDays,
  buildDayBalances,
  endOfMonth,
  monthMatrix,
  recordedPastDays,
  startOfMonth,
  startOfWeekMonday,
  sumBalances,
  toISODate,
} from "@/domain/balance";
import { computeGoalProgress, type GoalRow } from "@/domain/goals";
import {
  evaluateAndCompleteGoals,
  onJornadaVisit,
} from "@/lib/gamification";

type Search = Promise<{ periodo?: string }>;

export default async function JornadaPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const sp = await searchParams;
  // Default: semanal
  const periodo = sp.periodo === "mes" ? "mes" : "semana";

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

  const today = toISODate(new Date());
  await onJornadaVisit(supabase, user.id, today);
  await evaluateAndCompleteGoals(supabase, user.id);

  const fromDate =
    periodo === "mes" ? startOfMonth(new Date()) : startOfWeekMonday(new Date());
  const from = toISODate(fromDate);
  const to =
    periodo === "mes"
      ? toISODate(endOfMonth(new Date()))
      : toISODate(addDays(fromDate, 6));
  const rangeTo = to < today ? to : today;

  // Modal do calendário cobre o mês corrente
  const detailFrom = toISODate(startOfMonth(new Date()));
  const detailTo = toISODate(endOfMonth(new Date()));

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const goalRows = (goals ?? []) as GoalRow[];
  const goalDataFrom =
    goalRows.length > 0
      ? goalRows.reduce(
          (min, g) => (g.start_date < min ? g.start_date : min),
          goalRows[0].start_date,
        )
      : detailFrom;
  // Progresso de goals: desde o início do goal mais antigo até hoje (ou fim do mês)
  const goalFetchFrom = goalDataFrom < detailFrom ? goalDataFrom : detailFrom;
  const goalFetchTo = today > detailTo ? today : detailTo;

  const [
    { data: foods },
    { data: activities },
    { data: journals },
    { data: weights },
    { data: streak },
    { data: foodsDetail },
    { data: activitiesDetail },
    { data: journalsDetail },
    { data: stepsDetail },
    { data: foodsGoalRange },
    { data: activitiesGoalRange },
    { data: stepsGoalRange },
  ] = await Promise.all([
    supabase
      .from("food_entries")
      .select("logged_on, calories")
      .eq("user_id", user.id)
      .gte("logged_on", from)
      .lte("logged_on", rangeTo),
    supabase
      .from("activity_entries")
      .select("logged_on, calories_burned")
      .eq("user_id", user.id)
      .gte("logged_on", from)
      .lte("logged_on", rangeTo),
    supabase
      .from("journal_entries")
      .select("logged_on")
      .eq("user_id", user.id)
      .gte("logged_on", from)
      .lte("logged_on", rangeTo),
    supabase
      .from("weight_logs")
      .select("weight_kg, logged_on")
      .eq("user_id", user.id)
      .order("logged_on", { ascending: true })
      .limit(60),
    supabase
      .from("streaks")
      .select("current_streak")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("food_entries")
      .select("id, label, calories, meal_slot, logged_on")
      .eq("user_id", user.id)
      .gte("logged_on", detailFrom)
      .lte("logged_on", detailTo),
    supabase
      .from("activity_entries")
      .select(
        "id, description, calories_burned, activity_type, duration_minutes, logged_on",
      )
      .eq("user_id", user.id)
      .gte("logged_on", detailFrom)
      .lte("logged_on", detailTo),
    supabase
      .from("journal_entries")
      .select("logged_on, body, photo_path")
      .eq("user_id", user.id)
      .gte("logged_on", detailFrom)
      .lte("logged_on", detailTo),
    supabase
      .from("step_logs")
      .select("logged_on, steps")
      .eq("user_id", user.id)
      .gte("logged_on", detailFrom)
      .lte("logged_on", detailTo),
    supabase
      .from("food_entries")
      .select("logged_on, calories")
      .eq("user_id", user.id)
      .gte("logged_on", goalFetchFrom)
      .lte("logged_on", goalFetchTo),
    supabase
      .from("activity_entries")
      .select("logged_on, calories_burned")
      .eq("user_id", user.id)
      .gte("logged_on", goalFetchFrom)
      .lte("logged_on", goalFetchTo),
    supabase
      .from("step_logs")
      .select("logged_on, steps")
      .eq("user_id", user.id)
      .gte("logged_on", goalFetchFrom)
      .lte("logged_on", goalFetchTo),
  ]);

  const allDays = buildDayBalances({
    from,
    to: rangeTo,
    foods: foods ?? [],
    activities: activities ?? [],
    journalDays: (journals ?? []).map((j) => j.logged_on),
  });
  const days = recordedPastDays(allDays, today);
  const periodBalance = sumBalances(days);
  const periodIntake = days.reduce((s, d) => s + d.intake, 0);
  const periodBurn = days.reduce((s, d) => s + d.expenditure, 0);

  // Streak window: last N consecutive days ending today
  const streakLen = streak?.current_streak ?? 0;
  const streakDates = new Set<string>();
  for (let i = 0; i < streakLen; i++) {
    streakDates.add(toISODate(addDays(new Date(today + "T12:00:00"), -i)));
  }

  const goalsByDate = new Map<string, { id: string; title: string }[]>();
  for (const g of goalRows) {
    let cur = g.start_date;
    while (cur <= g.end_date) {
      const list = goalsByDate.get(cur) ?? [];
      list.push({ id: g.id, title: g.title });
      goalsByDate.set(cur, list);
      cur = toISODate(addDays(new Date(cur + "T12:00:00"), 1));
    }
  }

  const stepsByDate = new Map<string, number>();
  for (const s of stepsDetail ?? []) {
    stepsByDate.set(s.logged_on, s.steps);
  }

  // Janela recente: dias com registro no streak = 🔥; sem registro na janela = 🧊
  const lookback = Math.max(streakLen + 2, 1);
  const freezeCandidates = new Set<string>();
  for (let i = 0; i < lookback; i++) {
    freezeCandidates.add(
      toISODate(addDays(new Date(today + "T12:00:00"), -i)),
    );
  }

  const byDate: Record<
    string,
    {
      balance: number;
      hasRecord: boolean;
      inStreak: boolean;
      usedFreeze: boolean;
      goalIds: string[];
      steps: number;
    }
  > = {};
  for (const d of allDays) {
    const inWindow = freezeCandidates.has(d.date);
    byDate[d.date] = {
      balance: d.balance,
      hasRecord: d.hasRecord,
      inStreak: streakDates.has(d.date) && d.hasRecord,
      usedFreeze: inWindow && !d.hasRecord && d.date < today && streakLen > 0,
      goalIds: (goalsByDate.get(d.date) ?? []).map((g) => g.id),
      steps: stepsByDate.get(d.date) ?? 0,
    };
  }
  for (const [date, glist] of goalsByDate) {
    if (!byDate[date] && date >= from && date <= to) {
      byDate[date] = {
        balance: 0,
        hasRecord: false,
        inStreak: false,
        usedFreeze:
          freezeCandidates.has(date) && date < today && streakLen > 0,
        goalIds: glist.map((g) => g.id),
        steps: stepsByDate.get(date) ?? 0,
      };
    } else if (byDate[date]) {
      byDate[date].goalIds = glist.map((g) => g.id);
      byDate[date].steps = stepsByDate.get(date) ?? byDate[date].steps;
    }
  }
  for (const [date, steps] of stepsByDate) {
    if (!byDate[date] && date >= from && date <= to) {
      byDate[date] = {
        balance: 0,
        hasRecord: steps > 0,
        inStreak: streakDates.has(date) && steps > 0,
        usedFreeze: false,
        goalIds: (goalsByDate.get(date) ?? []).map((g) => g.id),
        steps,
      };
    } else if (byDate[date]) {
      byDate[date].steps = steps;
    }
  }

  const dayDetails: Record<string, DayDetail> = {};
  const allDetailDates = new Set<string>();
  for (const f of foodsDetail ?? []) allDetailDates.add(f.logged_on);
  for (const a of activitiesDetail ?? []) allDetailDates.add(a.logged_on);
  for (const j of journalsDetail ?? []) allDetailDates.add(j.logged_on);
  for (const s of stepsDetail ?? []) allDetailDates.add(s.logged_on);
  for (const date of goalsByDate.keys()) {
    if (date >= detailFrom && date <= detailTo) allDetailDates.add(date);
  }

  for (const date of allDetailDates) {
    dayDetails[date] = {
      date,
      foods: (foodsDetail ?? [])
        .filter((f) => f.logged_on === date)
        .map((f) => ({
          id: f.id,
          label: f.label,
          calories: f.calories,
          meal_slot: f.meal_slot,
        })),
      activities: (activitiesDetail ?? [])
        .filter((a) => a.logged_on === date)
        .map((a) => ({
          id: a.id,
          description: a.description,
          calories_burned: a.calories_burned,
          activity_type: a.activity_type,
          duration_minutes: a.duration_minutes,
        })),
      steps:
        (stepsDetail ?? []).find((s) => s.logged_on === date)?.steps ?? 0,
      journal: (() => {
        const j = (journalsDetail ?? []).find((x) => x.logged_on === date);
        if (!j) return null;
        return { body: j.body ?? "", hasPhoto: Boolean(j.photo_path) };
      })(),
      goals: goalsByDate.get(date) ?? [],
    };
  }

  const matrix = periodo === "mes" ? monthMatrix(new Date()) : null;
  const weekDays =
    periodo === "semana"
      ? Array.from({ length: 7 }, (_, i) => toISODate(addDays(fromDate, i)))
      : [];

  const currentWeight =
    weights && weights.length > 0
      ? Number(weights[weights.length - 1].weight_kg)
      : profile.weight_kg != null
        ? Number(profile.weight_kg)
        : null;

  const monthLabel = new Date().toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  const periodTitle = periodo === "mes" ? monthLabel : "Esta semana";

  return (
    <div className="min-h-full flex-1 bg-[#0A9396]">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-32 pt-6 sm:max-w-2xl">
        <header className="flex items-center justify-between gap-4">
          <Image
            src="/brand/well.svg"
            alt="WELL"
            width={120}
            height={50}
            className="h-8 w-auto"
          />
          <div className="flex items-center gap-2">
            <Link
              href="/jornada/novo"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold text-white"
            >
              <span aria-hidden>🎯</span>
              Objetivo
            </Link>
            <LogoutButton />
          </div>
        </header>

        <section className="relative mt-6 overflow-hidden rounded-[1.75rem] bg-[#005F73] px-5 py-6">
          <p className="text-sm font-bold uppercase tracking-wide text-white/70">
            Saldo · {periodTitle}
          </p>
          <p className="mt-2 font-sans text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
            {periodBalance > 0 ? "+" : ""}
            {Math.round(periodBalance)}
            <span className="ml-1 text-xl font-bold opacity-80">kcal</span>
          </p>
          <p className="mt-2 text-sm font-semibold text-white/80">
            Só dias com registro · sem gasto basal
          </p>
          <dl className="mt-5 grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-2xl bg-black/20 px-3 py-3 text-white">
              <dt className="text-xs text-white/70">Consumido</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums">
                {Math.round(periodIntake)}
              </dd>
            </div>
            <div className="rounded-2xl bg-black/20 px-3 py-3 text-white">
              <dt className="text-xs text-white/70">Gasto</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums">
                {Math.round(periodBurn)}
              </dd>
            </div>
            <div className="rounded-2xl bg-black/20 px-3 py-3 text-white">
              <dt className="text-xs text-white/70">Dias</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums">
                {days.length}
              </dd>
            </div>
          </dl>
        </section>

        <JornadaCalendar
          periodo={periodo}
          today={today}
          monthLabel={monthLabel}
          matrix={matrix}
          weekDays={weekDays}
          byDate={byDate}
          dayDetails={dayDetails}
        />

        <GoalsSection
          items={goalRows.map((goal) => {
            const goalDays = recordedPastDays(
              buildDayBalances({
                from: goal.start_date,
                to: goal.end_date < today ? goal.end_date : today,
                foods: (foodsGoalRange ?? []).filter(
                  (f) =>
                    f.logged_on >= goal.start_date &&
                    f.logged_on <= goal.end_date,
                ),
                activities: (activitiesGoalRange ?? []).filter(
                  (a) =>
                    a.logged_on >= goal.start_date &&
                    a.logged_on <= goal.end_date,
                ),
              }),
              today,
            );
            const stepsTotal = (stepsGoalRange ?? [])
              .filter(
                (s) =>
                  s.logged_on >= goal.start_date &&
                  s.logged_on <= goal.end_date,
              )
              .reduce((sum, s) => sum + s.steps, 0);
            const progress = computeGoalProgress({
              goal,
              days: goalDays,
              currentWeightKg: currentWeight,
              startWeightKg: currentWeight,
              today,
              stepsTotal,
            });
            const pct = Math.min(100, Math.round(progress.ratio * 100));
            return { goal, progress, pct };
          })}
        />

        <WeightPanel
          weights={(weights ?? []).map((w) => ({
            logged_on: w.logged_on,
            weight_kg: Number(w.weight_kg),
          }))}
        />

        <Suspense fallback={null}>
          <FeedbackToast />
        </Suspense>
        <AppNav active="/jornada" />
      </div>
    </div>
  );
}
