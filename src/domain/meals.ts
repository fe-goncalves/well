import type { MealSlot } from "@/domain";

export const MEAL_SLOTS: {
  id: MealSlot;
  label: string;
}[] = [
  { id: "breakfast", label: "Café da manhã" },
  { id: "lunch", label: "Almoço" },
  { id: "afternoon_snack", label: "Lanche da tarde" },
  { id: "dinner", label: "Jantar" },
  { id: "supper", label: "Ceia" },
];

export function mealSlotLabel(slot: MealSlot | string): string {
  return MEAL_SLOTS.find((s) => s.id === slot)?.label ?? slot;
}
