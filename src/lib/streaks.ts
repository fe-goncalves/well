import type { SupabaseClient } from "@supabase/supabase-js";

export type StreakUpdate = {
  current: number;
  longest: number;
  freezes: number;
  changed: boolean;
};

/** Marca o dia como ativo no streak (estilo LinkedIn + freezes). */
export async function registerDayActivity(
  supabase: SupabaseClient,
  userId: string,
  activeDate: string,
): Promise<StreakUpdate | null> {
  const { data: streak } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!streak) return null;

  if (streak.last_active_date === activeDate) {
    return {
      current: streak.current_streak ?? 0,
      longest: streak.longest_streak ?? 0,
      freezes: streak.freeze_count ?? 0,
      changed: false,
    };
  }

  let current = streak.current_streak ?? 0;
  let longest = streak.longest_streak ?? 0;
  let freezes = streak.freeze_count ?? 0;
  let consecutive = streak.consecutive_for_freeze ?? 0;
  const last = streak.last_active_date as string | null;

  if (!last) {
    current = 1;
    consecutive = 1;
  } else {
    const lastDate = new Date(last + "T12:00:00");
    const todayDate = new Date(activeDate + "T12:00:00");
    const diffDays = Math.round(
      (todayDate.getTime() - lastDate.getTime()) / 86_400_000,
    );

    if (diffDays === 1) {
      current += 1;
      consecutive += 1;
    } else if (diffDays > 1) {
      const gaps = diffDays - 1;
      if (gaps <= freezes) {
        freezes -= gaps;
        current += 1;
        consecutive = 1;
      } else {
        current = 1;
        consecutive = 1;
        freezes = 0;
      }
    }
  }

  if (consecutive >= 5 && freezes < 2) {
    freezes += 1;
    consecutive = 0;
  }

  longest = Math.max(longest, current);

  await supabase
    .from("streaks")
    .update({
      current_streak: current,
      longest_streak: longest,
      last_active_date: activeDate,
      freeze_count: freezes,
      consecutive_for_freeze: consecutive,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  return { current, longest, freezes, changed: true };
}
