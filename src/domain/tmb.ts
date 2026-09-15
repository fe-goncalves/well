/** Mifflin–St Jeor (kcal/dia) — gasto de repouso. */

export type BiologicalSex = "female" | "male";

export function mifflinStJeor(input: {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  sex: BiologicalSex;
}): number {
  const base =
    10 * input.weightKg + 6.25 * input.heightCm - 5 * input.ageYears;
  const tmb = input.sex === "male" ? base + 5 : base - 161;
  return Math.round(tmb);
}

export function ageFromBirthDate(
  birthDate: string | Date,
  today = new Date(),
): number {
  const birth = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

/**
 * Gasto base do dia = só a TMB (ou override manual).
 * Atividade física NÃO entra aqui — só quando o usuário lançar registro.
 */
export function dailyBaseExpenditure(input: {
  tmb: number;
  tmbOverride?: number | null;
}): number {
  if (input.tmbOverride && input.tmbOverride > 0) return Math.round(input.tmbOverride);
  return Math.round(input.tmb);
}
