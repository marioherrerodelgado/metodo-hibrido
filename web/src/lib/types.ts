// ─── Modelo de datos de Método Híbrido ────────────────────────────────────
// Mantiene compatibilidad con las colecciones que ya existen en Firestore
// (`wods`, `competiciones`) creadas por la app legacy / admin.html.

export type Sport = "running" | "crossfit" | "hyrox" | "deka" | "fuerza" | "movilidad";

export const SPORTS: Sport[] = [
  "running",
  "crossfit",
  "hyrox",
  "deka",
  "fuerza",
  "movilidad",
];

export const SPORT_LABEL: Record<Sport, string> = {
  running: "Running",
  crossfit: "CrossFit",
  hyrox: "Hyrox",
  deka: "DEKA",
  fuerza: "Fuerza",
  movilidad: "Movilidad",
};

/** Color de dato por deporte. Coincide con los tokens de globals.css. */
export const SPORT_COLOR: Record<Sport, string> = {
  running: "#4ade80",
  crossfit: "#fb7185",
  hyrox: "#a78bfa",
  deka: "#fbbf24",
  fuerza: "#60a5fa",
  movilidad: "#22d3ee",
};

export type Intensity = "baja" | "media" | "alta" | "maxima";

export const INTENSITY_LABEL: Record<Intensity, string> = {
  baja: "Suave",
  media: "Moderado",
  alta: "Exigente",
  maxima: "Máxima",
};

export const INTENSITY_COLOR: Record<Intensity, string> = {
  baja: "#4ade80",
  media: "#60a5fa",
  alta: "#fbbf24",
  maxima: "#ef4444",
};

/** Valor numérico usado para ponderar la carga muscular semanal. */
export const INTENSITY_WEIGHT: Record<Intensity, number> = {
  baja: 0.5,
  media: 1,
  alta: 1.6,
  maxima: 2.2,
};

/** Un entrenamiento. `fecha` es la clave real; `date` existía en datos antiguos. */
export interface Wod {
  id: string;
  /** YYYY-MM-DD */
  fecha: string;
  /** YYYY-MM (denormalizado para consultar por mes) */
  month: string;
  sport: Sport;
  titulo: string;
  intensity: Intensity;
  duration?: string;
  volume?: string;
  type?: string;
  sede?: string;
  notes?: string;
  warmup?: string;
  main?: string;
  metcon?: string;
  cooldown?: string;
  /** Zonas corporales trabajadas. Si falta, se infiere del texto. */
  muscles?: MuscleGroup[];
  /** Marca los generados por IA para poder distinguirlos en la UI. */
  source?: "coach" | "ai" | "biblioteca";
  /** uid del creador cuando es un WOD personal (generado por IA o guardado). */
  ownerId?: string;
}

export interface Competition {
  id?: string;
  /** YYYY-MM-DD */
  date: string;
  name: string;
  dist: string;
  lugar: string;
  cat: Sport;
  note?: string;
}

// ─── Zonas corporales ─────────────────────────────────────────────────────

export type MuscleGroup =
  | "pecho"
  | "espalda"
  | "hombros"
  | "biceps"
  | "triceps"
  | "core"
  | "gluteos"
  | "cuadriceps"
  | "isquios"
  | "gemelos"
  | "antebrazos"
  | "cardio";

export const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  pecho: "Pecho",
  espalda: "Espalda",
  hombros: "Hombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  core: "Core",
  gluteos: "Glúteos",
  cuadriceps: "Cuádriceps",
  isquios: "Isquios",
  gemelos: "Gemelos",
  antebrazos: "Antebrazos",
  cardio: "Sistema cardiovascular",
};

export const MUSCLE_GROUPS = Object.keys(MUSCLE_LABEL) as MuscleGroup[];

// ─── Usuario y roles ──────────────────────────────────────────────────────

export type Role = "athlete" | "coach" | "admin";

export type Level = "principiante" | "intermedio" | "avanzado";

export interface UserProfile {
  uid: string;
  email: string;
  name?: string;
  role: Role;
  createdAt?: number;
  /** El test inicial es opcional: se puede saltar. */
  onboarding?: Onboarding;
  onboardingDone?: boolean;
  onboardingSkipped?: boolean;
  /** Deportes que le interesan; ["all"] = todos. */
  goals?: (Sport | "all")[];
}

export interface Onboarding {
  level?: Level;
  /** Días que puede entrenar por semana. */
  daysPerWeek?: number;
  /** Minutos por sesión. */
  sessionMinutes?: number;
  /** Objetivo principal. */
  goal?: "fuerza" | "resistencia" | "hibrido" | "perder-grasa" | "competir";
  sports?: Sport[];
  /** Lesiones o zonas a evitar. */
  limitations?: MuscleGroup[];
  equipment?: Equipment[];
  updatedAt?: number;
}

export type Equipment =
  | "barra"
  | "mancuernas"
  | "kettlebell"
  | "anillas"
  | "cajon"
  | "remo"
  | "assault-bike"
  | "cinta"
  | "sled"
  | "sandbag"
  | "comba"
  | "sin-material";

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barra: "Barra + discos",
  mancuernas: "Mancuernas",
  kettlebell: "Kettlebell",
  anillas: "Anillas / barra dominadas",
  cajon: "Cajón",
  remo: "Remo",
  "assault-bike": "Assault bike",
  cinta: "Cinta / pista",
  sled: "Trineo",
  sandbag: "Sandbag",
  comba: "Comba",
  "sin-material": "Sin material",
};

// ─── Registro de sesiones completadas ─────────────────────────────────────

export interface SessionLog {
  id: string;
  /** YYYY-MM-DD */
  fecha: string;
  wodId?: string;
  titulo: string;
  sport: Sport;
  intensity: Intensity;
  muscles: MuscleGroup[];
  /** RPE percibido 1-10, opcional. */
  rpe?: number;
  notes?: string;
  createdAt: number;
}

// ─── Cargas y skills ──────────────────────────────────────────────────────

export interface LiftEntry {
  id: string;
  movement: string;
  weight: number;
  reps: number;
  /** YYYY-MM-DD */
  date: string;
  createdAt?: number;
}

/** skillId -> fecha de desbloqueo (YYYY-MM-DD) */
export type SkillDates = Record<string, string>;
