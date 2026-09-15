export type DayBalance = {
  date: string;
  intake: number;
  expenditure: number;
  balance: number;
  hasFood: boolean;
  hasActivity: boolean;
  hasRecord: boolean;
};

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function startOfWeekMonday(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  const day = (x.getDay() + 6) % 7; // Mon=0
  x.setDate(x.getDate() - day);
  return x;
}

export function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 12);
}

export function endOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 12);
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function eachDate(from: string, to: string): string[] {
  const out: string[] = [];
  let cur = new Date(from + "T12:00:00");
  const end = new Date(to + "T12:00:00");
  while (cur <= end) {
    out.push(toISODate(cur));
    cur = addDays(cur, 1);
  }
  return out;
}

/**
 * Saldo do dia = kcal consumidas − kcal gastas (atividades).
 * Sem TMB/basal na conta.
 * Positivo = comeu mais do que registrou de gasto.
 */
export function buildDayBalances(input: {
  from: string;
  to: string;
  foods: { logged_on: string; calories: number }[];
  activities: { logged_on: string; calories_burned: number }[];
  journalDays?: string[];
}): DayBalance[] {
  const intakeByDay = new Map<string, number>();
  const burnByDay = new Map<string, number>();
  const foodDays = new Set<string>();
  const activityDays = new Set<string>();
  const journalDays = new Set(input.journalDays ?? []);

  for (const f of input.foods) {
    foodDays.add(f.logged_on);
    intakeByDay.set(
      f.logged_on,
      (intakeByDay.get(f.logged_on) ?? 0) + f.calories,
    );
  }
  for (const a of input.activities) {
    activityDays.add(a.logged_on);
    burnByDay.set(
      a.logged_on,
      (burnByDay.get(a.logged_on) ?? 0) + a.calories_burned,
    );
  }

  return eachDate(input.from, input.to).map((date) => {
    const intake = intakeByDay.get(date) ?? 0;
    const expenditure = burnByDay.get(date) ?? 0;
    const hasFood = foodDays.has(date);
    const hasActivity = activityDays.has(date);
    const hasRecord = hasFood || hasActivity || journalDays.has(date);
    return {
      date,
      intake,
      expenditure,
      balance: intake - expenditure,
      hasFood,
      hasActivity,
      hasRecord,
    };
  });
}

/** Dias passados (≤ hoje) que tiveram algum registro. */
export function recordedPastDays(
  days: DayBalance[],
  today: string,
): DayBalance[] {
  return days.filter((d) => d.date <= today && d.hasRecord);
}

export function sumBalances(days: DayBalance[]): number {
  return days.reduce((s, d) => s + d.balance, 0);
}

export function monthMatrix(anchor = new Date()): (string | null)[][] {
  const start = startOfMonth(anchor);
  const end = endOfMonth(anchor);
  const days = eachDate(toISODate(start), toISODate(end));
  const lead = (start.getDay() + 6) % 7; // Mon-first
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...days,
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}
