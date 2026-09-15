/** Catálogo de atividades físicas (~40) — pesquisa e seleção. */

export type ActivityTypeDef = {
  id: string;
  label: string;
  emoji: string;
  group: "cardio" | "strength" | "sport" | "mind" | "daily" | "other";
};

export const ACTIVITY_TYPES: ActivityTypeDef[] = [
  { id: "walking", label: "Caminhada", emoji: "🚶", group: "cardio" },
  { id: "brisk_walk", label: "Caminhada rápida", emoji: "🥾", group: "cardio" },
  { id: "jogging", label: "Corrida leve", emoji: "🏃", group: "cardio" },
  { id: "running", label: "Corrida", emoji: "🏃‍♂️", group: "cardio" },
  { id: "sprint", label: "Sprint / tiros", emoji: "⚡", group: "cardio" },
  { id: "cycling", label: "Ciclismo", emoji: "🚴", group: "cardio" },
  { id: "spinning", label: "Spinning", emoji: "🚲", group: "cardio" },
  { id: "swimming", label: "Natação", emoji: "🏊", group: "cardio" },
  { id: "rowing", label: "Remo", emoji: "🚣", group: "cardio" },
  { id: "elliptical", label: "Elíptico", emoji: "⏺️", group: "cardio" },
  { id: "jump_rope", label: "Pular corda", emoji: "🪢", group: "cardio" },
  { id: "hiit", label: "HIIT", emoji: "💥", group: "cardio" },
  { id: "dance", label: "Dança", emoji: "💃", group: "cardio" },
  { id: "zumba", label: "Zumba", emoji: "🕺", group: "cardio" },
  { id: "aerobics", label: "Aeróbica", emoji: "🤸", group: "cardio" },
  { id: "stair_climb", label: "Subir escadas", emoji: "🪜", group: "cardio" },
  { id: "hiking", label: "Trilha / hiking", emoji: "🏔️", group: "cardio" },

  { id: "gym_weights", label: "Musculação", emoji: "🏋️", group: "strength" },
  { id: "bodyweight", label: "Calistenia", emoji: "💪", group: "strength" },
  { id: "crossfit", label: "CrossFit", emoji: "🔥", group: "strength" },
  { id: "functional", label: "Funcional", emoji: "🧱", group: "strength" },
  { id: "pilates", label: "Pilates", emoji: "🧘‍♀️", group: "strength" },
  { id: "yoga", label: "Yoga", emoji: "🧘", group: "mind" },
  { id: "stretching", label: "Alongamento", emoji: "🙆", group: "mind" },
  { id: "mobility", label: "Mobilidade", emoji: "🔄", group: "mind" },
  { id: "meditation", label: "Meditação", emoji: "🕊️", group: "mind" },

  { id: "football", label: "Futebol", emoji: "⚽", group: "sport" },
  { id: "basketball", label: "Basquete", emoji: "🏀", group: "sport" },
  { id: "volleyball", label: "Vôlei", emoji: "🏐", group: "sport" },
  { id: "tennis", label: "Tênis", emoji: "🎾", group: "sport" },
  { id: "beach_tennis", label: "Beach tennis", emoji: "🏖️", group: "sport" },
  { id: "padel", label: "Padel", emoji: "🏸", group: "sport" },
  { id: "martial_arts", label: "Artes marciais", emoji: "🥋", group: "sport" },
  { id: "boxing", label: "Boxe", emoji: "🥊", group: "sport" },
  { id: "jiu_jitsu", label: "Jiu-jitsu", emoji: "🤼", group: "sport" },
  { id: "surf", label: "Surf", emoji: "🏄", group: "sport" },
  { id: "skate", label: "Skate", emoji: "🛹", group: "sport" },
  { id: "climbing", label: "Escalada", emoji: "🧗", group: "sport" },

  { id: "housework", label: "Tarefas domésticas", emoji: "🧹", group: "daily" },
  { id: "gardening", label: "Jardinagem", emoji: "🌱", group: "daily" },
  { id: "commute_bike", label: "Deslocamento de bike", emoji: "🚲", group: "daily" },
  { id: "commute_walk", label: "Deslocamento a pé", emoji: "👟", group: "daily" },
  { id: "play_kids", label: "Brincar com crianças", emoji: "🧒", group: "daily" },
  { id: "other", label: "Outro", emoji: "✨", group: "other" },
];

export function activityTypeById(id: string | null | undefined) {
  return ACTIVITY_TYPES.find((t) => t.id === id) ?? null;
}

export function searchActivityTypes(q: string) {
  const needle = q.trim().toLowerCase();
  if (!needle) return ACTIVITY_TYPES;
  return ACTIVITY_TYPES.filter(
    (t) =>
      t.label.toLowerCase().includes(needle) ||
      t.id.includes(needle) ||
      t.group.includes(needle),
  );
}
