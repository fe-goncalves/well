import {
  ageFromBirthDate,
  dailyBaseExpenditure,
  mifflinStJeor,
  type BiologicalSex,
} from "@/domain/tmb";

/** Teto calórico sugerido a partir da TMB (não entra no saldo do dia). */
export function suggestDailyCalorieCeiling(profile: {
  biological_sex: BiologicalSex | null;
  birth_date: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  tmb_override: number | null;
}): { tmb: number; ceiling: number; note: string } | null {
  if (
    !profile.biological_sex ||
    !profile.birth_date ||
    !profile.height_cm ||
    !profile.weight_kg
  ) {
    return null;
  }
  const tmb = dailyBaseExpenditure({
    tmb: mifflinStJeor({
      weightKg: Number(profile.weight_kg),
      heightCm: Number(profile.height_cm),
      ageYears: ageFromBirthDate(profile.birth_date),
      sex: profile.biological_sex,
    }),
    tmbOverride: profile.tmb_override,
  });
  // Teto leve de manutenção ≈ TMB (sem lifestyle multiplier — atividades entram à parte)
  return {
    tmb,
    ceiling: tmb,
    note: "Estimativa de gasto em repouso (Mifflin–St Jeor). Use como referência de teto, não como saldo automático.",
  };
}

/** Sugere déficit total no período a partir do teto diário × dias × fração. */
export function suggestPeriodDeficit(ceiling: number, days: number, fraction = 0.2) {
  return Math.round(ceiling * days * fraction);
}
