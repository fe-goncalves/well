import type { SupabaseClient } from "@supabase/supabase-js";
import { levelFromXp, type XpEventType } from "@/domain";
import { XP_REWARDS } from "@/domain";
import { registerDayActivity } from "@/lib/streaks";
import { buildDayBalances, toISODate } from "@/domain/balance";
import {
  computeGoalProgress,
  type GoalRow,
} from "@/domain/goals";

export type GamificationResult = {
  xpGained: number;
  newBadges: string[];
  streak: number | null;
  leveledUpTo: number | null;
};

async function alreadyAwardedToday(
  supabase: SupabaseClient,
  userId: string,
  eventType: XpEventType,
  day: string,
) {
  const { data } = await supabase
    .from("xp_events")
    .select("id")
    .eq("user_id", userId)
    .eq("event_type", eventType)
    .filter("meta->>day", "eq", day)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function awardXp(
  supabase: SupabaseClient,
  userId: string,
  eventType: XpEventType,
  amount: number,
  meta: Record<string, unknown> = {},
): Promise<number> {
  if (amount <= 0) return 0;

  const { error } = await supabase.from("xp_events").insert({
    user_id: userId,
    event_type: eventType,
    xp_amount: amount,
    meta,
  });
  if (error) return 0;

  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, level")
    .eq("id", userId)
    .single();

  const nextXp = (profile?.xp ?? 0) + amount;
  const nextLevel = levelFromXp(nextXp);
  await supabase
    .from("profiles")
    .update({
      xp: nextXp,
      level: nextLevel,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  return amount;
}

async function grantBadge(
  supabase: SupabaseClient,
  userId: string,
  badgeId: string,
): Promise<boolean> {
  const { data: existing } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId)
    .eq("badge_id", badgeId)
    .maybeSingle();
  if (existing) return false;

  const { error } = await supabase.from("user_badges").insert({
    user_id: userId,
    badge_id: badgeId,
  });
  if (error) return false;

  const { data: badge } = await supabase
    .from("badges")
    .select("xp_bonus")
    .eq("id", badgeId)
    .single();

  if (badge?.xp_bonus && badge.xp_bonus > 0) {
    await awardXp(supabase, userId, "badge_earned", badge.xp_bonus, {
      badge_id: badgeId,
    });
  }
  return true;
}

async function maybeStreakBadgesAndXp(
  supabase: SupabaseClient,
  userId: string,
  streak: number,
  result: GamificationResult,
) {
  const milestones: { at: number; xp: number; badge?: string }[] = [
    { at: 7, xp: 50, badge: "streak_7" },
    { at: 30, xp: 100, badge: "streak_30" },
    { at: 100, xp: 200, badge: "streak_100" },
  ];

  for (const m of milestones) {
    if (streak !== m.at) continue;
    const gained = await awardXp(
      supabase,
      userId,
      "streak_milestone",
      m.xp,
      { streak: m.at },
    );
    result.xpGained += gained;
    if (m.badge && (await grantBadge(supabase, userId, m.badge))) {
      result.newBadges.push(m.badge);
    }
  }
}

async function maybeDayComplete(
  supabase: SupabaseClient,
  userId: string,
  day: string,
  result: GamificationResult,
) {
  if (await alreadyAwardedToday(supabase, userId, "day_complete", day)) return;

  const [{ count: foods }, { count: activities }, { count: journals }] =
    await Promise.all([
      supabase
        .from("food_entries")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("logged_on", day),
      supabase
        .from("activity_entries")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("logged_on", day),
      supabase
        .from("journal_entries")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("logged_on", day),
    ]);

  const hasFood = (foods ?? 0) > 0;
  const hasSide = (activities ?? 0) > 0 || (journals ?? 0) > 0;
  if (!hasFood || !hasSide) return;

  result.xpGained += await awardXp(supabase, userId, "day_complete", 25, {
    day,
  });
}

async function maybeWeekLogger(
  supabase: SupabaseClient,
  userId: string,
  day: string,
  result: GamificationResult,
) {
  const d = new Date(day + "T12:00:00");
  const mondayOffset = (d.getDay() + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const from = toISODate(monday);
  const to = toISODate(sunday);

  const { data } = await supabase
    .from("food_entries")
    .select("logged_on")
    .eq("user_id", userId)
    .gte("logged_on", from)
    .lte("logged_on", to);

  const uniqueDays = new Set((data ?? []).map((r) => r.logged_on));
  if (uniqueDays.size >= 5) {
    if (await grantBadge(supabase, userId, "week_logger")) {
      result.newBadges.push("week_logger");
    }
  }
}

function emptyResult(): GamificationResult {
  return { xpGained: 0, newBadges: [], streak: null, leveledUpTo: null };
}

async function withLevelCheck(
  supabase: SupabaseClient,
  userId: string,
  beforeLevel: number,
  result: GamificationResult,
) {
  const { data } = await supabase
    .from("profiles")
    .select("level")
    .eq("id", userId)
    .single();
  if (data && data.level > beforeLevel) result.leveledUpTo = data.level;
}

export async function onFoodLogged(
  supabase: SupabaseClient,
  userId: string,
  day: string,
  entryCount: number,
): Promise<GamificationResult> {
  const result = emptyResult();
  const { data: before } = await supabase
    .from("profiles")
    .select("level")
    .eq("id", userId)
    .single();

  const per = XP_REWARDS.food_log ?? 10;
  for (let i = 0; i < entryCount; i++) {
    result.xpGained += await awardXp(supabase, userId, "food_log", per);
  }

  const { count } = await supabase
    .from("food_entries")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  if ((count ?? 0) > 0 && (await grantBadge(supabase, userId, "first_plate"))) {
    result.newBadges.push("first_plate");
  }

  const streakInfo = await registerDayActivity(supabase, userId, day);
  result.streak = streakInfo?.current ?? null;
  if (streakInfo) {
    await maybeStreakBadgesAndXp(supabase, userId, streakInfo.current, result);
  }

  await maybeDayComplete(supabase, userId, day, result);
  await maybeWeekLogger(supabase, userId, day, result);
  await withLevelCheck(supabase, userId, before?.level ?? 1, result);
  return result;
}

export async function onFoodEdited(
  supabase: SupabaseClient,
  userId: string,
): Promise<GamificationResult> {
  const result = emptyResult();
  const { data: before } = await supabase
    .from("profiles")
    .select("level")
    .eq("id", userId)
    .single();

  result.xpGained += await awardXp(
    supabase,
    userId,
    "food_edit_correct",
    XP_REWARDS.food_edit_correct ?? 5,
  );
  if (await grantBadge(supabase, userId, "honest_fork")) {
    result.newBadges.push("honest_fork");
  }
  await withLevelCheck(supabase, userId, before?.level ?? 1, result);
  return result;
}

export async function onActivityLogged(
  supabase: SupabaseClient,
  userId: string,
  day: string,
): Promise<GamificationResult> {
  const result = emptyResult();
  const { data: before } = await supabase
    .from("profiles")
    .select("level")
    .eq("id", userId)
    .single();

  result.xpGained += await awardXp(
    supabase,
    userId,
    "activity_log",
    XP_REWARDS.activity_log ?? 10,
  );
  if (await grantBadge(supabase, userId, "first_move")) {
    result.newBadges.push("first_move");
  }

  const streakInfo = await registerDayActivity(supabase, userId, day);
  result.streak = streakInfo?.current ?? null;
  if (streakInfo) {
    await maybeStreakBadgesAndXp(supabase, userId, streakInfo.current, result);
  }
  await maybeDayComplete(supabase, userId, day, result);
  await withLevelCheck(supabase, userId, before?.level ?? 1, result);
  return result;
}

export async function onJournalSaved(
  supabase: SupabaseClient,
  userId: string,
  day: string,
  opts: { isNewDayEntry: boolean; hasPhoto: boolean },
): Promise<GamificationResult> {
  const result = emptyResult();
  const { data: before } = await supabase
    .from("profiles")
    .select("level")
    .eq("id", userId)
    .single();

  if (
    opts.isNewDayEntry &&
    !(await alreadyAwardedToday(supabase, userId, "journal_log", day))
  ) {
    result.xpGained += await awardXp(
      supabase,
      userId,
      "journal_log",
      XP_REWARDS.journal_log ?? 15,
      { day },
    );
  }

  if (
    opts.hasPhoto &&
    !(await alreadyAwardedToday(supabase, userId, "journal_photo", day))
  ) {
    result.xpGained += await awardXp(
      supabase,
      userId,
      "journal_photo",
      XP_REWARDS.journal_photo ?? 5,
      { day },
    );
    if (await grantBadge(supabase, userId, "photo_day")) {
      result.newBadges.push("photo_day");
    }
  }

  if (await grantBadge(supabase, userId, "first_page")) {
    result.newBadges.push("first_page");
  }

  const streakInfo = await registerDayActivity(supabase, userId, day);
  result.streak = streakInfo?.current ?? null;
  if (streakInfo) {
    await maybeStreakBadgesAndXp(supabase, userId, streakInfo.current, result);
  }
  await maybeDayComplete(supabase, userId, day, result);
  await withLevelCheck(supabase, userId, before?.level ?? 1, result);
  return result;
}

export async function onGoalCreated(
  supabase: SupabaseClient,
  userId: string,
): Promise<GamificationResult> {
  const result = emptyResult();
  if (await grantBadge(supabase, userId, "goal_maker")) {
    result.newBadges.push("goal_maker");
  }
  return result;
}

export async function onWeightLogged(
  supabase: SupabaseClient,
  userId: string,
  day: string,
): Promise<GamificationResult> {
  const result = emptyResult();
  if (await alreadyAwardedToday(supabase, userId, "weight_log", day)) {
    return result;
  }
  result.xpGained += await awardXp(
    supabase,
    userId,
    "weight_log",
    XP_REWARDS.weight_log ?? 10,
    { day },
  );
  return result;
}

export async function onJornadaVisit(
  supabase: SupabaseClient,
  userId: string,
  day: string,
): Promise<GamificationResult> {
  const result = emptyResult();
  if (!(await alreadyAwardedToday(supabase, userId, "goal_checkin", day))) {
    result.xpGained += await awardXp(
      supabase,
      userId,
      "goal_checkin",
      XP_REWARDS.goal_checkin ?? 5,
      { day, source: "jornada" },
    );
  }

  // balance_aware: 4 semanas distintas com goal_checkin
  const { data: events } = await supabase
    .from("xp_events")
    .select("created_at")
    .eq("user_id", userId)
    .eq("event_type", "goal_checkin");

  const weeks = new Set(
    (events ?? []).map((e) => {
      const d = new Date(e.created_at);
      const onejan = new Date(d.getFullYear(), 0, 1);
      const week = Math.ceil(
        ((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7,
      );
      return `${d.getFullYear()}-W${week}`;
    }),
  );
  if (weeks.size >= 4 && (await grantBadge(supabase, userId, "balance_aware"))) {
    result.newBadges.push("balance_aware");
  }

  return result;
}

export async function evaluateAndCompleteGoals(
  supabase: SupabaseClient,
  userId: string,
): Promise<GamificationResult> {
  const result = emptyResult();
  const today = toISODate(new Date());

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (!profile) return result;

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active");

  if (!goals?.length) return result;

  const minStart = goals.reduce(
    (min, g) => (g.start_date < min ? g.start_date : min),
    goals[0].start_date,
  );

  const [{ data: foods }, { data: activities }, { data: weights }, { data: steps }] =
    await Promise.all([
      supabase
        .from("food_entries")
        .select("logged_on, calories")
        .eq("user_id", userId)
        .gte("logged_on", minStart)
        .lte("logged_on", today),
      supabase
        .from("activity_entries")
        .select("logged_on, calories_burned")
        .eq("user_id", userId)
        .gte("logged_on", minStart)
        .lte("logged_on", today),
      supabase
        .from("weight_logs")
        .select("weight_kg, logged_on")
        .eq("user_id", userId)
        .order("logged_on", { ascending: false }),
      supabase
        .from("step_logs")
        .select("logged_on, steps")
        .eq("user_id", userId)
        .gte("logged_on", minStart)
        .lte("logged_on", today),
    ]);

  const allDays = buildDayBalances({
    from: minStart,
    to: today,
    foods: foods ?? [],
    activities: activities ?? [],
  });

  const currentWeight =
    weights?.[0]?.weight_kg != null
      ? Number(weights[0].weight_kg)
      : profile.weight_kg != null
        ? Number(profile.weight_kg)
        : null;

  for (const goal of goals as GoalRow[]) {
    const goalDays = allDays.filter(
      (d) => d.date >= goal.start_date && d.date <= goal.end_date,
    );
    const startWeightLog = (weights ?? [])
      .filter((w) => w.logged_on <= goal.start_date)
      .sort((a, b) => b.logged_on.localeCompare(a.logged_on))[0];
    const stepsTotal = (steps ?? [])
      .filter(
        (s) =>
          s.logged_on >= goal.start_date && s.logged_on <= goal.end_date,
      )
      .reduce((sum, s) => sum + s.steps, 0);

    const progress = computeGoalProgress({
      goal,
      days: goalDays,
      currentWeightKg: currentWeight,
      startWeightKg: startWeightLog
        ? Number(startWeightLog.weight_kg)
        : currentWeight,
      today,
      stepsTotal,
    });

    if (progress.ratio < 1) continue;

    await supabase
      .from("goals")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", goal.id);

    result.xpGained += await awardXp(
      supabase,
      userId,
      "goal_reached",
      XP_REWARDS.goal_reached ?? 100,
      { goal_id: goal.id },
    );
    if (await grantBadge(supabase, userId, "goal_finisher")) {
      result.newBadges.push("goal_finisher");
    }
  }

  return result;
}
