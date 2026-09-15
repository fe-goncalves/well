/** Tipos e regras puras do domínio — sem React, sem Supabase. */

export type MealSlot =
  | "breakfast"
  | "lunch"
  | "afternoon_snack"
  | "dinner"
  | "supper";

export type Confidence = "low" | "medium" | "high";
export type EntrySource = "ai" | "manual" | "ai_edited";

export type XpEventType =
  | "food_log"
  | "food_edit_correct"
  | "activity_log"
  | "journal_log"
  | "journal_photo"
  | "day_complete"
  | "weight_log"
  | "goal_checkin"
  | "goal_reached"
  | "streak_milestone"
  | "badge_earned";

export const XP_REWARDS: Partial<Record<XpEventType, number>> = {
  food_log: 10,
  food_edit_correct: 5,
  activity_log: 10,
  journal_log: 15,
  journal_photo: 5,
  day_complete: 25,
  weight_log: 10,
  goal_checkin: 5,
  goal_reached: 100,
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
