import type { MealSlot } from "@/domain";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SavedFood = {
  id: string;
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  default_meal_slot: string | null;
  times_used: number;
  last_used_at: string | null;
};

export type SavedFoodInput = {
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  default_meal_slot?: MealSlot | string | null;
};

/** Upsert por label (case-insensitive): atualiza macros se já existir. */
export async function upsertSavedFood(
  supabase: SupabaseClient,
  userId: string,
  input: SavedFoodInput,
): Promise<{ id: string } | { error: string }> {
  const label = input.label.trim();
  if (!label) return { error: "Label vazio" };

  const { data: existing } = await supabase
    .from("food_saved")
    .select("id")
    .eq("user_id", userId)
    .ilike("label", label)
    .maybeSingle();

  const row = {
    label,
    calories: Math.round(Number(input.calories) || 0),
    protein: Number(input.protein) || 0,
    carbs: Number(input.carbs) || 0,
    fat: Number(input.fat) || 0,
    default_meal_slot: input.default_meal_slot ?? null,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await supabase
      .from("food_saved")
      .update(row)
      .eq("id", existing.id);
    if (error) return { error: error.message };
    return { id: existing.id };
  }

  const { data, error } = await supabase
    .from("food_saved")
    .insert({ user_id: userId, ...row })
    .select("id")
    .single();
  if (error) return { error: error.message };
  return { id: data.id };
}

export async function listSavedFoods(
  supabase: SupabaseClient,
  userId: string,
): Promise<SavedFood[]> {
  const { data, error } = await supabase
    .from("food_saved")
    .select(
      "id, label, calories, protein, carbs, fat, default_meal_slot, times_used, last_used_at",
    )
    .eq("user_id", userId)
    .order("last_used_at", { ascending: false, nullsFirst: false })
    .order("times_used", { ascending: false });

  if (error) return [];
  return (data ?? []) as SavedFood[];
}

export async function deleteSavedFood(
  supabase: SupabaseClient,
  id: string,
): Promise<string | null> {
  const { error } = await supabase.from("food_saved").delete().eq("id", id);
  return error?.message ?? null;
}

/** Copia um alimento salvo para o dia (sem IA). */
export async function importSavedFoodToDay(
  supabase: SupabaseClient,
  userId: string,
  saved: SavedFood,
  mealSlot: MealSlot,
  loggedOn: string,
): Promise<{ error?: string }> {
  const { error } = await supabase.from("food_entries").insert({
    user_id: userId,
    logged_on: loggedOn,
    raw_text: saved.label,
    label: saved.label,
    meal_slot: mealSlot,
    calories: saved.calories,
    protein: saved.protein,
    carbs: saved.carbs,
    fat: saved.fat,
    confidence: "high",
    source: "manual",
  });

  if (error) return { error: error.message };

  await supabase
    .from("food_saved")
    .update({
      times_used: (saved.times_used ?? 0) + 1,
      last_used_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", saved.id);

  return {};
}
