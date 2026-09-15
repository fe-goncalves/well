/** Tipos e regras puras do domínio — sem React, sem Supabase. */

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack" | "other";
export type Confidence = "low" | "medium" | "high";
export type EntrySource = "ai" | "manual" | "ai_edited";

export type XpEventType =
  | "log_entry"
  | "day_active"
  | "manual_correct"
  | "badge_earned";

export const XP_REWARDS: Record<XpEventType, number> = {
  log_entry: 10,
  day_active: 25,
  manual_correct: 15,
  badge_earned: 0, // bônus vem do badge.xp_bonus
};

/** Nível a partir do XP acumulado. Curva suave para uso diário. */
export function levelFromXp(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(xp / 50)) + 1);
}

export function xpForNextLevel(level: number): number {
  return 50 * level * level;
}

export type FoodEstimateItem = {
  label: string;
  mealSlot: MealSlot;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: Confidence;
};

export type FoodEstimateResult = {
  items: FoodEstimateItem[];
  notes?: string;
};

export type DayTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export function sumTotals(
  items: Pick<FoodEstimateItem, "calories" | "protein" | "carbs" | "fat">[],
): DayTotals {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export type BadgeId =
  | "first_log"
  | "streak_3"
  | "streak_7"
  | "streak_30"
  | "honest_edit"
  | "week_logger";
