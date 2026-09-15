export function feedbackQuery(result: {
  xpGained: number;
  newBadges: string[];
  leveledUpTo: number | null;
}): string {
  const params = new URLSearchParams();
  if (result.xpGained > 0) params.set("xp", String(result.xpGained));
  if (result.newBadges.length) params.set("badges", result.newBadges.join(","));
  if (result.leveledUpTo) params.set("level", String(result.leveledUpTo));
  const q = params.toString();
  return q ? `?${q}` : "";
}
