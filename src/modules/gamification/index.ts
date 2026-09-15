import { XP_REWARDS, levelFromXp, type XpEventType } from "@/domain";

export const GAMIFICATION_MODULE = {
  id: "gamification",
  phase: 2, // XP/streak na fase 2; badges ricos na fase 3
  description: "XP, nível, streak e badges — regras positivas apenas",
} as const;

export function rewardFor(event: XpEventType): number {
  return XP_REWARDS[event];
}

export { levelFromXp };
