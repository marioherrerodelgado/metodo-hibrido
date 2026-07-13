// Catálogo de movimientos con carga y de skills desbloqueables.

export interface MovementCategory {
  label: string;
  color: string;
  movements: string[];
}

export const MOVEMENT_CATEGORIES: Record<string, MovementCategory> = {
  halterofilia: {
    label: "Halterofilia",
    color: "#3b82f6",
    movements: [
      "Snatch",
      "Power Snatch",
      "Clean & Jerk",
      "Power Clean",
      "Clean",
      "Jerk",
      "Overhead Squat",
    ],
  },
  fuerza: {
    label: "Fuerza",
    color: "#64748b",
    movements: [
      "Back Squat",
      "Front Squat",
      "Deadlift",
      "Peso Muerto Rumano",
      "Bench Press",
      "Strict Press",
      "Push Press",
      "Hip Thrust",
      "Barbell Row",
      "Weighted Pull-up",
    ],
  },
  metcon: {
    label: "CrossFit / Metcon",
    color: "#f43f5e",
    movements: [
      "Thruster",
      "Wall Ball",
      "Kettlebell Swing",
      "Dumbbell Snatch",
      "Devil Press",
      "Box Step-up",
      "Sandbag Clean",
      "Farmer Carry",
    ],
  },
};

export const ALL_MOVEMENTS: { name: string; color: string; cat: string }[] =
  Object.values(MOVEMENT_CATEGORIES).flatMap((c) =>
    c.movements.map((m) => ({ name: m, color: c.color, cat: c.label })),
  );

export function movementColor(name: string): string {
  return ALL_MOVEMENTS.find((m) => m.name === name)?.color ?? "#8e8e93";
}

export interface Skill {
  id: string;
  name: string;
  cat: "Gimnástica" | "Cíclico" | "Halterofilia";
  /** Orden de dificultad aproximado, para agrupar la vista. */
  tier: 1 | 2 | 3;
}

export const SKILLS: Skill[] = [
  { id: "double-unders-50", name: "50 dobles unbroken", cat: "Cíclico", tier: 1 },
  { id: "pistol-squat", name: "Pistol Squat", cat: "Gimnástica", tier: 1 },
  { id: "l-sit-30", name: "L-Sit 30s", cat: "Gimnástica", tier: 1 },
  { id: "toes-to-bar", name: "Toes to Bar", cat: "Gimnástica", tier: 1 },
  { id: "strict-pullup", name: "Dominada estricta", cat: "Gimnástica", tier: 1 },
  { id: "butterfly-pullup", name: "Butterfly Pull-up", cat: "Gimnástica", tier: 2 },
  { id: "chest-to-bar", name: "Chest to Bar", cat: "Gimnástica", tier: 2 },
  { id: "bar-muscle-up", name: "Bar Muscle-up", cat: "Gimnástica", tier: 2 },
  { id: "kipping-hspu", name: "HSPU kipping", cat: "Gimnástica", tier: 2 },
  { id: "rope-climb", name: "Rope Climb", cat: "Gimnástica", tier: 2 },
  { id: "ring-muscle-up", name: "Ring Muscle-up", cat: "Gimnástica", tier: 3 },
  { id: "strict-hspu", name: "HSPU estricto", cat: "Gimnástica", tier: 3 },
  { id: "handstand-walk", name: "Handstand Walk (10 m)", cat: "Gimnástica", tier: 3 },
  { id: "freestanding-hs", name: "Handstand libre", cat: "Gimnástica", tier: 3 },
  { id: "legless-rope", name: "Rope Climb sin piernas", cat: "Gimnástica", tier: 3 },
  { id: "bodyweight-snatch", name: "Snatch a tu peso corporal", cat: "Halterofilia", tier: 3 },
];

export const SKILL_TIER_LABEL: Record<1 | 2 | 3, string> = {
  1: "Base",
  2: "Intermedio",
  3: "Avanzado",
};
