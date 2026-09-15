import { goalStatusCopy } from "@/domain/copy";
import type { DayBalance } from "@/domain/balance";

export type GoalType =
  | "weight_target"
  | "calorie_deficit"
  | "calorie_surplus"
  | "logging_habit"
  | "steps_target";

export type GoalRow = {
  id: string;
  goal_type: GoalType;
  title: string;
  target_value: number;
  start_date: string;
  end_date: string;
  status: "active" | "completed" | "cancelled";
  meta: Record<string, unknown>;
};

export type GoalProgress = {
  current: number;
  target: number;
  ratio: number; // 0..1+
  status: "onTrack" | "near" | "offTrack";
  label: string;
  detail: string;
};

export const GOAL_TYPES: {
  id: GoalType;
  label: string;
  hint: string;
}[] = [
  {
    id: "weight_target",
    label: "Peso alvo",
    hint: "Atingir um peso até uma data",
  },
  {
    id: "calorie_deficit",
    label: "Déficit no período",
    hint: "Somar déficit (gasto − ingestão) ≥ N kcal",
  },
  {
    id: "calorie_surplus",
    label: "Superávit no período",
    hint: "Somar superávit (ingestão − gasto) ≥ N kcal",
  },
  {
    id: "logging_habit",
    label: "Dias registrando",
    hint: "Registrar alimentação em N dias no período",
  },
  {
    id: "steps_target",
    label: "Passos no período",
    hint: "Somar passos ≥ N no período",
  },
];

function clampRatio(n: number) {
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

function statusFromRatio(ratio: number, daysLeft: number): GoalProgress["status"] {
  if (ratio >= 1) return "onTrack";
  if (ratio >= 0.7 || daysLeft <= 2) return "near";
  if (ratio < 0.35 && daysLeft <= 5) return "offTrack";
  if (ratio >= 0.45) return "onTrack";
  return "near";
}

export function computeGoalProgress(input: {
  goal: GoalRow;
  days: DayBalance[];
  currentWeightKg: number | null;
  startWeightKg: number | null;
  today?: string;
  /** Soma de passos no período (para steps_target). */
  stepsTotal?: number;
}): GoalProgress {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const end = new Date(input.goal.end_date + "T12:00:00");
  const now = new Date(today + "T12:00:00");
  const daysLeft = Math.max(
    0,
    Math.round((end.getTime() - now.getTime()) / 86_400_000),
  );
  const target = Number(input.goal.target_value);

  if (input.goal.goal_type === "steps_target") {
    const current = Math.max(0, input.stepsTotal ?? 0);
    const ratio = clampRatio(current / target);
    const status = statusFromRatio(ratio, daysLeft);
    return {
      current,
      target,
      ratio,
      status,
      label: goalStatusCopy[status],
      detail: `${Math.round(current).toLocaleString("pt-BR")} / ${Math.round(target).toLocaleString("pt-BR")} passos`,
    };
  }

  if (input.goal.goal_type === "logging_habit") {
    const current = input.days.filter((d) => d.hasFood).length;
    const ratio = clampRatio(current / target);
    const status = statusFromRatio(ratio, daysLeft);
    return {
      current,
      target,
      ratio,
      status,
      label: goalStatusCopy[status],
      detail: `${current} de ${target} dias com alimentação`,
    };
  }

  if (input.goal.goal_type === "calorie_deficit") {
    // Déficit = gastou mais que comeu = saldo negativo (consumido − gasto)
    const current = Math.max(
      0,
      input.days.reduce((s, d) => s + Math.max(0, -d.balance), 0),
    );
    const ratio = clampRatio(current / target);
    const status = statusFromRatio(ratio, daysLeft);
    return {
      current,
      target,
      ratio,
      status,
      label: goalStatusCopy[status],
      detail: `${Math.round(current)} / ${Math.round(target)} kcal de déficit`,
    };
  }

  if (input.goal.goal_type === "calorie_surplus") {
    // Superávit = comeu mais que gastou = saldo positivo
    const current = Math.max(
      0,
      input.days.reduce((s, d) => s + Math.max(0, d.balance), 0),
    );
    const ratio = clampRatio(current / target);
    const status = statusFromRatio(ratio, daysLeft);
    return {
      current,
      target,
      ratio,
      status,
      label: goalStatusCopy[status],
      detail: `${Math.round(current)} / ${Math.round(target)} kcal de superávit`,
    };
  }

  // weight_target
  const startW = input.startWeightKg;
  const currentW = input.currentWeightKg;
  if (startW == null || currentW == null) {
    return {
      current: 0,
      target,
      ratio: 0,
      status: "near",
      label: goalStatusCopy.near,
      detail: "Atualize seu peso para ver o progresso",
    };
  }
  const totalDelta = startW - target;
  const doneDelta = startW - currentW;
  // Se alvo é ganhar peso, totalDelta negativo
  const ratio =
    Math.abs(totalDelta) < 0.01
      ? currentW === target
        ? 1
        : 0
      : clampRatio(doneDelta / totalDelta);
  const status =
    ratio >= 1
      ? "onTrack"
      : Math.abs(currentW - target) <= 0.5
        ? "near"
        : statusFromRatio(ratio, daysLeft);

  return {
    current: currentW,
    target,
    ratio: Math.min(ratio, 1.5),
    status,
    label: goalStatusCopy[status],
    detail: `Agora ${currentW.toFixed(1)} kg · alvo ${target % 1 === 0 ? target : target.toFixed(1)} kg`,
  };
}

export function defaultGoalTitle(type: GoalType, value: number, end: string): string {
  const endLabel = end.split("-").reverse().join("/");
  switch (type) {
    case "weight_target":
      return `Chegar a ${value} kg até ${endLabel}`;
    case "calorie_deficit":
      return `Déficit de ${value} kcal até ${endLabel}`;
    case "calorie_surplus":
      return `Superávit de ${value} kcal até ${endLabel}`;
    case "logging_habit":
      return `Registrar comida em ${value} dias até ${endLabel}`;
    case "steps_target":
      return `${Math.round(value).toLocaleString("pt-BR")} passos até ${endLabel}`;
  }
}
